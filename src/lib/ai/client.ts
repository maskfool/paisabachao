import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { buildSystemPrompt, type StrictnessLevel } from "./systemPrompt";
import { buildFinancialContext } from "./contextBuilder";
import { db } from "@/lib/db";

export interface ChatOptions {
  apiKey: string;
  provider: "anthropic" | "openai";
  strictness?: StrictnessLevel;
  model?: string;
  onToken: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

interface MessageParam {
  role: "user" | "assistant";
  content: string;
}

// Detect provider from model name
export function getProviderFromModel(model: string): "anthropic" | "openai" {
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  return "anthropic";
}

// Get default model for provider
export function getDefaultModel(provider: "anthropic" | "openai"): string {
  return provider === "openai" ? "gpt-4o" : "claude-sonnet-4-20250514";
}

/**
 * Builds chat history and memory context shared by both providers.
 */
async function buildChatContext(sessionId: string) {
  // Load recent chat history for this session (last 20 messages)
  const history = await db.chatMessages
    .where("sessionId")
    .equals(sessionId)
    .sortBy("timestamp");

  const recentHistory = history.slice(-20);

  // Load memory from previous sessions
  const allMessages = await db.chatMessages
    .orderBy("timestamp")
    .reverse()
    .limit(200)
    .toArray();

  const prevSessionMessages = allMessages
    .filter((m) => m.sessionId !== sessionId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Group by session, take last 2 exchanges (4 messages) from up to 3 prior sessions
  const seenSessions = new Set<string>();
  const memoryMessages: string[] = [];
  for (const msg of prevSessionMessages) {
    if (seenSessions.size >= 3) break;
    if (!seenSessions.has(msg.sessionId)) {
      seenSessions.add(msg.sessionId);
    }
    if (seenSessions.has(msg.sessionId) && memoryMessages.filter((m) => m.startsWith(`[${msg.sessionId.slice(0, 8)}`)).length < 4) {
      const date = msg.timestamp.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      memoryMessages.push(`[${msg.sessionId.slice(0, 8)}] ${date} ${msg.role}: ${msg.content.slice(0, 200)}`);
    }
  }

  let memoryContext = "";
  if (memoryMessages.length > 0) {
    memoryContext = `\n\n[PREVIOUS CONVERSATIONS — for memory/context]\n${memoryMessages.reverse().join("\n")}\n[END PREVIOUS CONVERSATIONS]`;
  }

  // Build messages array
  const messages: MessageParam[] = [];
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return { messages, memoryContext };
}

/**
 * Stream response from Anthropic (Claude)
 */
async function streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: MessageParam[],
  userMessage: string,
  onToken: (text: string) => void,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const allMessages = [...messages, { role: "user" as const, content: userMessage }];

  let fullText = "";
  const stream = client.messages.stream({
    model: model as "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: allMessages,
  });

  return new Promise((resolve, reject) => {
    stream.on("text", (text) => {
      fullText += text;
      onToken(text);
    });
    stream.on("end", () => resolve(fullText));
    stream.on("error", (err) => reject(err));
    stream.finalMessage().catch(reject);
  });
}

/**
 * Stream response from OpenAI (GPT)
 */
async function streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: MessageParam[],
  userMessage: string,
  onToken: (text: string) => void,
): Promise<string> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userMessage },
  ];

  let fullText = "";
  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: allMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullText += text;
      onToken(text);
    }
  }

  return fullText;
}

/**
 * Sends a message to the AI with financial context and streams the response.
 * Supports both Anthropic (Claude) and OpenAI (GPT) providers.
 */
export async function sendMessage(
  userMessage: string,
  sessionId: string,
  options: ChatOptions
): Promise<void> {
  const {
    apiKey,
    provider = "anthropic",
    strictness = "strict",
    model,
    onToken,
    onDone,
    onError,
  } = options;

  if (!apiKey) {
    onError("No API key configured. Go to Settings to add your API key.");
    return;
  }

  const resolvedModel = model || getDefaultModel(provider);

  try {
    // Build shared context
    const financialContext = await buildFinancialContext();
    const systemPrompt = buildSystemPrompt(strictness);
    const { messages, memoryContext } = await buildChatContext(sessionId);
    const fullSystemPrompt = `${systemPrompt}\n\n${financialContext}${memoryContext}`;

    let fullText: string;

    if (provider === "openai") {
      fullText = await streamOpenAI(apiKey, resolvedModel, fullSystemPrompt, messages, userMessage, onToken);
    } else {
      fullText = await streamAnthropic(apiKey, resolvedModel, fullSystemPrompt, messages, userMessage, onToken);
    }

    onDone(fullText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect to AI.";
    if (message.includes("401") || message.includes("authentication") || message.includes("Incorrect API key")) {
      onError(`Invalid ${provider === "openai" ? "OpenAI" : "Claude"} API key. Please check your key in Settings.`);
    } else if (message.includes("429")) {
      onError("Rate limited. Please wait a moment and try again.");
    } else if (message.includes("model_not_found") || message.includes("does not exist")) {
      onError(`Model "${resolvedModel}" not available on your API plan. Try a different model.`);
    } else {
      onError(message);
    }
  }
}
