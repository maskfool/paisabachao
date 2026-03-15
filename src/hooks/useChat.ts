import { useState, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { sendMessage } from "@/lib/ai/client";
import { parseActions } from "@/lib/ai/actionParser";
import { executeAction } from "@/lib/ai/actionExecutor";
import type { StrictnessLevel } from "@/lib/ai/systemPrompt";
import type { ChatMessage } from "@/types";

export function useChat(sessionId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const messages = useLiveQuery(
    () =>
      db.chatMessages
        .where("sessionId")
        .equals(sessionId)
        .sortBy("timestamp"),
    [sessionId]
  ) ?? [];

  const send = useCallback(
    async (text: string, apiKey: string, strictness: StrictnessLevel = "strict") => {
      if (!text.trim() || isStreaming) return;

      setError(null);
      abortRef.current = false;

      // Save user message
      await db.chatMessages.add({
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
        sessionId,
      });

      setIsStreaming(true);
      setStreamingText("");

      let fullText = "";

      await sendMessage(text.trim(), sessionId, {
        apiKey,
        strictness,
        onToken: (token) => {
          if (abortRef.current) return;
          fullText += token;
          setStreamingText(fullText);
        },
        onDone: async (responseText) => {
          if (abortRef.current) return;

          // Parse and execute any actions
          const { action, cleanText } = parseActions(responseText);
          let actionResult: string | undefined;

          if (action) {
            actionResult = await executeAction(action);
          }

          // Save assistant message
          await db.chatMessages.add({
            role: "assistant",
            content: cleanText,
            timestamp: new Date(),
            sessionId,
            actions: action ? [action] : undefined,
          });

          // If there was an action, save a system note about the result
          if (actionResult && action) {
            // The confirmation is already part of the AI's response typically,
            // but we store the action metadata for reference
          }

          setIsStreaming(false);
          setStreamingText("");
        },
        onError: (errMsg) => {
          setError(errMsg);
          setIsStreaming(false);
          setStreamingText("");
        },
      });
    },
    [sessionId, isStreaming]
  );

  const clearSession = useCallback(async () => {
    await db.chatMessages.where("sessionId").equals(sessionId).delete();
  }, [sessionId]);

  return {
    messages,
    isStreaming,
    streamingText,
    error,
    send,
    clearSession,
  };
}

export function useChatSessions() {
  const allMessages = useLiveQuery(() => db.chatMessages.toArray()) ?? [];

  // Group by sessionId, get latest message per session
  const sessionMap = new Map<string, { sessionId: string; lastMessage: string; timestamp: Date; count: number }>();
  for (const msg of allMessages) {
    const existing = sessionMap.get(msg.sessionId);
    if (!existing || msg.timestamp > existing.timestamp) {
      sessionMap.set(msg.sessionId, {
        sessionId: msg.sessionId,
        lastMessage: msg.content.slice(0, 80),
        timestamp: msg.timestamp,
        count: (existing?.count ?? 0) + 1,
      });
    } else {
      sessionMap.set(msg.sessionId, { ...existing, count: existing.count + 1 });
    }
  }

  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const createSession = () => crypto.randomUUID();

  const deleteSession = async (sessionId: string) => {
    await db.chatMessages.where("sessionId").equals(sessionId).delete();
  };

  return { sessions, createSession, deleteSession };
}
