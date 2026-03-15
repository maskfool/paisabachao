import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Sparkles, DollarSign, TrendingUp, CreditCard, BarChart3, Target, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TEMPLATES = [
  { icon: DollarSign, label: "Add Expense", prompt: "I spent $__ on __" },
  { icon: TrendingUp, label: "Add Income", prompt: "I received $__ as income from __" },
  { icon: TrendingUp, label: "Add Investment", prompt: "I invested $__ in __" },
  { icon: CreditCard, label: "Record Withdrawal", prompt: "I withdrew $__ from my account" },
  { icon: BarChart3, label: "Monthly Analysis", prompt: "How's my spending this month? Give me a full breakdown." },
  { icon: Target, label: "Goal Progress", prompt: "How am I progressing towards my savings goals?" },
  { icon: ShoppingCart, label: "Can I afford...?", prompt: "Can I afford to buy __? Check my budget and goals." },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: `# 👋 Welcome to SmartSpend AI

I'm your **strict financial advisor**. I don't sugarcoat — I help you build wealth by being honest about your spending.

Here's what I can do:
- 📝 **Log transactions** — just tell me what you spent or earned
- 🚫 **Purchase advice** — I'll say NO if it hurts your goals
- 📊 **Financial analysis** — ask me how you're doing
- 🎯 **Goal tracking** — check your progress anytime

**Try tapping a template below or type your question!**`,
    timestamp: new Date(),
  },
];

// Simulated AI responses based on user input
function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes("can i") && (lower.includes("buy") || lower.includes("afford"))) {
    return `## 🚫 Let me check...

Based on your current financial situation:

| Metric | Value |
|--------|-------|
| Monthly Budget Remaining | $832 |
| Savings Goal Progress | 65% |
| Debt Payments Pending | $500 |

**VERDICT: NO.** ❌

Here's why:
1. Your **shopping budget** is already at 100% ($200/$200)
2. You're behind on your **Emergency Fund** goal by $350 this month
3. This purchase would push your spending 15% over your monthly target

> 💡 **Recommendation:** Wait until next month when your budget resets. Set aside the amount now so you're ready.

*Ask me again after March 15 when your paycheck arrives.*`;
  }
  
  if (lower.includes("spent") || lower.includes("expense") || lower.includes("paid")) {
    return `## ✅ Transaction Logged

| Field | Value |
|-------|-------|
| Type | Expense |
| Amount | Detected from your message |
| Date | March 9, 2026 |
| Status | Recorded |

Your **remaining budget** for this category has been updated.

⚠️ **Heads up:** You're now at **88%** of your monthly limit for this category. Be careful with additional spending here.

*Need to edit this? Just say "undo last transaction."*`;
  }
  
  if (lower.includes("how") && (lower.includes("spending") || lower.includes("month") || lower.includes("doing"))) {
    return `## 📊 March 2026 Financial Summary

### Overview
| Metric | Amount |
|--------|--------|
| 💰 Income | $5,200 |
| 💸 Expenses | $1,843.49 |
| 📈 Invested | $500 |
| 💵 Net Savings | $2,856.51 |

### Top Spending Categories
1. 🏠 **Rent** — $1,200 (65%)
2. 🛍️ **Shopping** — $200 (11%)
3. ⚡ **Utilities** — $120 (7%)
4. 🍽️ **Dining** — $132 (7%)
5. 🩺 **Healthcare** — $75 (4%)

### Health Assessment: **B+**
- ✅ You're saving 55% of income — excellent
- ⚠️ Dining is at 88% of budget — slow down
- ⚠️ Shopping budget maxed out
- ✅ Investments on track

> 💡 **Tip:** Cut dining out by $50 next week to hit your A rating.`;
  }
  
  if (lower.includes("goal") || lower.includes("progress") || lower.includes("saving")) {
    return `## 🎯 Goal Progress Report

### 1. Emergency Fund
- **Target:** $10,000 | **Current:** $6,500
- Progress: ████████░░ **65%**
- On track for December 2026 ✅

### 2. Vacation to Japan
- **Target:** $5,000 | **Current:** $2,200
- Progress: ████░░░░░░ **44%**
- ⚠️ Behind schedule — need $467/month

### 3. New Laptop
- **Target:** $2,000 | **Current:** $800
- Progress: ████░░░░░░ **40%**
- ⚠️ Need $400/month to meet deadline

### 4. Student Loan Payoff
- **Target:** $15,000 | **Current:** $9,000
- Progress: ██████░░░░ **60%**
- On track ✅

> 💡 **Action needed:** Increase monthly allocation for Japan fund by $167 to stay on track.`;
  }
  
  if (lower.includes("income") || lower.includes("received") || lower.includes("salary") || lower.includes("earned")) {
    return `## ✅ Income Recorded!

| Field | Value |
|-------|-------|
| Type | Income |
| Status | Logged successfully |
| Date | March 9, 2026 |

Your total income this month is now updated. 

📊 **Quick Stats:**
- Monthly income target: **On track** ✅
- Savings allocation: Automatically distributed to goals
- Emergency fund contribution: Applied

*Great work! Consistent income tracking helps me give better advice.*`;
  }
  
  if (lower.includes("invest")) {
    return `## 📈 Investment Logged

| Field | Value |
|-------|-------|
| Type | Investment |
| Status | Recorded |

**Portfolio Update:**
- Total invested this month: $500+
- Investment rate: ~10% of income ✅

> 💡 **Smart move!** Consistent investing beats timing the market. You're on track for a solid portfolio growth this year.

*Want me to analyze your investment allocation?*`;
  }
  
  if (lower.includes("withdraw")) {
    return `## 🏧 Withdrawal Recorded

| Field | Value |
|-------|-------|
| Type | ATM Withdrawal |
| Status | Logged |

⚠️ **Reminder:** Cash withdrawals are harder to track. Try to note what you spend this cash on so I can keep your budget accurate.

*Tip: You can tell me later — "I used $50 cash for groceries" and I'll categorize it properly.*`;
  }
  
  return `## 🤔 I understand your question.

Here's my take based on your current financial profile:

- **Current balance:** $3,357 after all expenses
- **Budget utilization:** 64% of monthly budget used
- **Days left in month:** 22

I'd recommend focusing on your highest-priority goal right now: the **Emergency Fund**. Every dollar counts.

*Can you be more specific? Try asking:*
- "Can I afford [item]?"
- "How's my spending this month?"
- "Add expense: $X for [category]"`;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
        {/* Chat Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">SmartSpend AI</h2>
            <p className="text-xs text-muted-foreground">Your strict financial advisor</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-3 [&_td]:px-3 [&_th]:py-1 [&_td]:py-1 [&_table]:border-border [&_th]:border-border [&_td]:border-border">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
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
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="flex-1 bg-secondary border-0"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" className="gradient-primary border-0 shrink-0" disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
