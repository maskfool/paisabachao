import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, type StrictnessLevel } from "./systemPrompt";
import { buildFinancialContext } from "./contextBuilder";
import { db } from "@/lib/db";

export interface ChatOptions {
  apiKey: string;
  strictness?: StrictnessLevel;
  onToken: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

interface MessageParam {
  role: "user" | "assistant";
  content: string;
}

/**
 * Sends a message to Claude with financial context and streams the response.
 * Loads chat history from the current session for context continuity.
 */
export async function sendMessage(
  userMessage: string,
  sessionId: string,
  options: ChatOptions
): Promise<void> {
  const { apiKey, strictness = "strict", onToken, onDone, onError } = options;

  if (!apiKey) {
    onError("No API key configured. Go to Settings to add your Claude API key.");
    return;
  }

  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Build financial context
    const financialContext = await buildFinancialContext();
    const systemPrompt = buildSystemPrompt(strictness);

    // Load recent chat history for this session (last 20 messages for context)
    const history = await db.chatMessages
      .where("sessionId")
      .equals(sessionId)
      .sortBy("timestamp");

    const recentHistory = history.slice(-20);

    // Build messages array
    const messages: MessageParam[] = [];

    // Add history (skip system messages)
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // Stream the response
    let fullText = "";

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `${systemPrompt}\n\n${financialContext}`,
      messages,
    });

    stream.on("text", (text) => {
      fullText += text;
      onToken(text);
    });

    stream.on("end", () => {
      onDone(fullText);
    });

    stream.on("error", (error) => {
      onError(error instanceof Error ? error.message : "An error occurred while communicating with Claude.");
    });

    // Wait for stream to finish
    await stream.finalMessage();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect to Claude API.";
    if (message.includes("401") || message.includes("authentication")) {
      onError("Invalid API key. Please check your key in Settings.");
    } else if (message.includes("429")) {
      onError("Rate limited. Please wait a moment and try again.");
    } else {
      onError(message);
    }
  }
}
