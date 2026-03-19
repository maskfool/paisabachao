import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, DollarSign, TrendingUp, CreditCard, BarChart3,
  Target, ShoppingCart, Plus, Trash2, MessageSquarePlus, AlertCircle,
  Loader2, HeartPulse, Lightbulb, Calendar, ArrowDownCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat, useChatSessions } from "@/hooks/useChat";
import { useSettings } from "@/hooks/useSettings";
import { decrypt } from "@/lib/crypto";
import type { StrictnessLevel } from "@/lib/ai/systemPrompt";

const TEMPLATES = [
  { icon: DollarSign, label: "Add Expense", prompt: "I spent $__ on __" },
  { icon: TrendingUp, label: "Add Income", prompt: "I received $__ as income from __" },
  { icon: TrendingUp, label: "Add Investment", prompt: "I invested $__ in __" },
  { icon: ArrowDownCircle, label: "Withdrawal", prompt: "I withdrew $__ from my account" },
  { icon: ShoppingCart, label: "Can I afford...?", prompt: "Can I afford to buy __? Check my budget and goals." },
  { icon: BarChart3, label: "Budget Check", prompt: "How's my budget looking this month?" },
  { icon: Target, label: "Goal Progress", prompt: "How are my savings goals going?" },
  { icon: HeartPulse, label: "Health Report", prompt: "Give me a complete financial health report." },
  { icon: Calendar, label: "Monthly Summary", prompt: "Give me my monthly spending summary." },
  { icon: Lightbulb, label: "Smart Advice", prompt: "What should I do with my money this month?" },
];

const WELCOME_MESSAGE = `# Welcome to PaisaBachao AI

I'm your **strict financial advisor**. I don't sugarcoat — I help you build wealth by being honest about your spending.

Here's what I can do:
- **Log transactions** — just tell me what you spent or earned
- **Purchase advice** — I'll check your budget and goals before saying yes
- **Financial analysis** — ask how you're doing this month
- **Goal tracking** — check your progress anytime

**Tap a template below or type your question!**`;

export default function Chat() {
  const { settings } = useSettings();
  const { sessions, createSession } = useChatSessions();

  const [sessionId, setSessionId] = useState(() => {
    // Resume last session or create new
    return sessions[0]?.sessionId ?? createSession();
  });

  // Update sessionId when sessions load (for first render when sessions are empty)
  useEffect(() => {
    if (sessions.length > 0 && sessionId === "") {
      setSessionId(sessions[0].sessionId);
    }
  }, [sessions, sessionId]);

  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const strictness = (settings.aiStrictness as StrictnessLevel) || "strict";
  const aiModel = settings.aiModel || "claude-sonnet-4-20250514";
  const isOpenAI = aiModel.startsWith("gpt-") || aiModel.startsWith("o1") || aiModel.startsWith("o3");
  const activeKey = isOpenAI ? openaiKey : claudeKey;
  const provider = isOpenAI ? "openai" as const : "anthropic" as const;

  // Decrypt API keys from settings
  useEffect(() => {
    if (settings.apiKey) {
      decrypt(settings.apiKey).then(setClaudeKey).catch(() => setClaudeKey(settings.apiKey));
    }
    if (settings.openaiApiKey) {
      decrypt(settings.openaiApiKey).then(setOpenaiKey).catch(() => setOpenaiKey(settings.openaiApiKey));
    }
  }, [settings.apiKey, settings.openaiApiKey]);
  const { messages, isStreaming, streamingText, error, send, clearSession } = useChat(sessionId);

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isStreaming]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setInput("");
      send(text, activeKey, strictness, aiModel, provider);
    },
    [send, activeKey, strictness, aiModel, provider]
  );

  const handleNewChat = () => {
    const newId = createSession();
    setSessionId(newId);
  };

  const hasMessages = messages.length > 0;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
        {/* Chat Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">PaisaBachao AI</h2>
            <p className="text-xs text-muted-foreground">
              {strictness === "strict" ? "Strict" : strictness === "moderate" ? "Balanced" : "Gentle"} · {aiModel.includes("opus") ? "Opus" : aiModel.includes("haiku") ? "Haiku" : aiModel.includes("sonnet") ? "Sonnet" : aiModel === "gpt-4o" ? "GPT-4o" : aiModel === "gpt-4o-mini" ? "GPT-4o Mini" : aiModel === "o3-mini" ? "O3 Mini" : aiModel}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {activeKey ? (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-xs text-warning">No API key</span>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewChat} title="New chat">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            {hasMessages && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={clearSession} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message if no messages */}
          {!hasMessages && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="h-8 w-8 rounded-lg gradient-primary shrink-0 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[80%] rounded-xl px-4 py-3 bg-card border border-border">
                <div className="chat-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{WELCOME_MESSAGE}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${
                  msg.role === "assistant" ? "gradient-primary" : "bg-secondary"
                }`}>
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-secondary-foreground" />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="chat-markdown ">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {msg.actions.map((a, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {a.action.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming response */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="h-8 w-8 rounded-lg gradient-primary shrink-0 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[80%] rounded-xl px-4 py-3 bg-card border border-border">
                {streamingText ? (
                  <div className="chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Analyzing your finances...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-destructive/10 shrink-0 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="max-w-[80%] rounded-xl px-4 py-3 bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Templates */}
        <div className="px-4 py-2 border-t border-border bg-card/50">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setInput(t.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors whitespace-nowrap shrink-0"
              >
                <t.icon className="h-3 w-3" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          {!activeKey && (
            <p className="text-xs text-warning mb-2">Add your {isOpenAI ? "OpenAI" : "Claude"} API key in Settings to start chatting.</p>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeKey ? "Ask me anything about your finances..." : "Configure API key in Settings first..."}
              className="flex-1 bg-secondary border-0"
              disabled={isStreaming || !activeKey}
            />
            <Button
              type="submit"
              size="icon"
              className="gradient-primary border-0 shrink-0"
              disabled={!input.trim() || isStreaming || !activeKey}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
