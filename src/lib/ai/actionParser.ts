import type { AIAction } from "@/types";

/**
 * Parses action blocks from AI response text.
 * Actions are wrapped in ```action ... ``` code blocks.
 * Returns the parsed action and the cleaned response text (with action block removed).
 */
export function parseActions(responseText: string): {
  action: AIAction | null;
  cleanText: string;
} {
  const actionRegex = /```action\s*\n([\s\S]*?)```/;
  const match = responseText.match(actionRegex);

  if (!match) {
    return { action: null, cleanText: responseText };
  }

  try {
    const parsed = JSON.parse(match[1].trim()) as AIAction;

    // Validate required fields
    if (!parsed.action || !parsed.data) {
      return { action: null, cleanText: responseText };
    }

    // Remove the action block from displayed text
    const cleanText = responseText.replace(actionRegex, "").trim();

    return { action: parsed, cleanText };
  } catch {
    // JSON parse failed — return text as-is
    return { action: null, cleanText: responseText };
  }
}
