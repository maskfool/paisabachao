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

    // Load memory from previous sessions (last 10 messages from other sessions)
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
      system: `${systemPrompt}\n\n${financialContext}${memoryContext}`,
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
