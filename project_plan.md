# PaisaBachao — AI Finance App

## Project Vision

A **privacy-first, AI-powered personal finance app** that helps users control impulsive spending, track finances, and make disciplined financial decisions. The AI acts as a **strict financial advisor** — it will firmly say NO when a purchase doesn't fit the user's budget or goals.

**Core Principle:** Your financial data is YOURS. It never leaves your device unless you explicitly choose encrypted cloud sync.

---

## Problem Statement

- People overspend due to impulsive buying habits
- No app truly acts as a strict financial gatekeeper
- Most finance apps send your data to the cloud — privacy risk
- Generic budgeting tools lack intelligent, personalized advice
- Users need a financial advisor they can chat with 24/7

## Solution

An AI-powered finance app where:
- All data stays **local** (IndexedDB / encrypted SQLite)
- AI (Claude Opus) acts as a **strict, no-nonsense financial advisor**
- Users can chat naturally: "Can I buy AirPods?" → AI checks budget, goals, balance → gives a firm YES/NO with reasoning
- Transactions, goals, budgets managed via **AI chat + traditional UI**
- Financial health scoring and analytics — all computed locally

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────┐
│                    Browser / PWA                  │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Dexie.js   │  │   Anthropic SDK          │  │
│  │  (IndexedDB) │  │   (Claude Opus API)      │  │
│  │              │  │                          │  │
│  │  Transactions│  │  System Prompt +         │  │
│  │  Goals       │  │  Financial Context       │  │
│  │  Budgets     │  │  Injection               │  │
│  │  Chat History│  │                          │  │
│  │  Settings    │  │  Streaming Responses     │  │
│  │  Accounts    │  │  Action Parsing          │  │
│  └──────────────┘  └──────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │  Web Crypto API (AES-256-GCM)               ││
│  │  Client-side encryption for cloud sync      ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
   User's Device Only       Claude API (Anthropic)
   (data persisted here)    (processes & discards,
                             does NOT train on
                             API data per policy)
```

### For Product Shipping (Multi-User)

```
┌─────────────────┐       ┌─────────────────────┐
│  Browser / PWA   │       │  Supabase           │
│                  │       │                     │
│  IndexedDB       │       │  Auth only          │
│  (all fin. data) │       │  (email, OAuth)     │
│                  │       │                     │
│  Client-side     │       │  Encrypted blobs    │
│  encryption      │       │  (optional sync)    │
│  (AES-256-GCM)   │       │  Server can NOT     │
│                  │       │  read user data     │
└─────────────────┘       └─────────────────────┘
         │
         ▼
   Claude API
   (direct from browser,
    server never touches
    financial context)
```

---

## Tech Stack

### Frontend (Already Built)
| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool (port 8080) |
| Tailwind CSS | 3.4.17 | Styling |
| Shadcn UI | - | 55+ UI components (Radix UI based) |
| Framer Motion | 12.35.1 | Animations |
| Recharts | 2.15.4 | Charts (bar, pie, line) |
| React Router | 6.30.1 | Client-side routing |
| React Hook Form | 7.61.1 | Form handling |
| Zod | 3.25.76 | Schema validation |
| TanStack Query | 5.83.0 | Async state management |
| Lucide React | 0.462.0 | Icons |

### New Dependencies (To Add)
| Tech | Purpose |
|------|---------|
| **Dexie.js** | IndexedDB wrapper — local database |
| **@anthropic-ai/sdk** | Claude API client (Opus model) |
| **@supabase/supabase-js** | Auth + optional encrypted sync (Phase 2) |
| **Web Crypto API** | Client-side encryption (native, no dependency) |

### Backend (Minimal — Product Phase)
| Tech | Purpose |
|------|---------|
| Supabase Auth | User authentication (email, Google OAuth) |
| Supabase Storage | Encrypted blob storage for optional cloud sync |
| Stripe | Subscription billing (Phase 3) |

### Desktop (Phase 3)
| Tech | Purpose |
|------|---------|
| Tauri | Lightweight desktop wrapper (Rust-based) |
| SQLCipher | Encrypted SQLite for desktop builds |

---

## Database Schema (Dexie.js / IndexedDB)

### Tables

```typescript
// src/lib/db.ts

interface Account {
  id?: number;           // Auto-incremented
  name: string;          // "HDFC Savings", "Cash", "Paytm Wallet"
  type: "bank" | "cash" | "wallet" | "credit_card";
  balance: number;
  currency: string;      // "INR", "USD", etc.
  icon?: string;         // Optional icon identifier
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id?: number;
  type: "expense" | "income" | "investment" | "withdrawal" | "transfer";
  amount: number;
  currency: string;
  category: string;      // Maps to CATEGORIES constant
  description: string;
  accountId: number;     // FK to accounts
  date: Date;
  tags?: string[];       // Optional tags for filtering
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  createdAt: Date;
  addedVia: "chat" | "manual";  // Track how it was added
}

interface Goal {
  id?: number;
  title: string;         // "Emergency Fund", "MacBook Pro"
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: Date;
  category: string;
  priority: "high" | "medium" | "low";
  status: "active" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
}

interface Budget {
  id?: number;
  category: string;
  limit: number;
  spent: number;         // Auto-calculated from transactions
  currency: string;
  period: "monthly" | "yearly";
  alertThreshold: number; // Percentage (e.g., 80 = warn at 80% spent)
  createdAt: Date;
}

interface ChatMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  actions?: AIAction[];   // Actions executed from this message
  sessionId: string;      // Group messages by session
}

interface UserSettings {
  id?: number;
  key: string;            // "currency", "theme", "apiKey", "name", etc.
  value: string;
  updatedAt: Date;
}

// Indexes for fast queries
// transactions: [date, type, category, accountId]
// goals: [status, category]
// budgets: [category, period]
// chatMessages: [sessionId, timestamp]
// settings: [key]
```

---

## AI System Prompt Strategy

### Core Personality

```
You are PaisaBachao AI — a strict, no-nonsense Indian financial advisor.

Rules:
1. You are STRICT about money. If a purchase doesn't fit the budget or hurts
   financial goals, say NO firmly. Don't sugarcoat it.
2. You speak directly. No fluff. Give clear financial reasoning.
3. When asked "Can I afford X?", check: budget remaining, goal impact,
   current balance, spending pattern. If it hurts any of these → firm NO.
4. You can add transactions, update goals, and check budgets when asked.
5. You celebrate good financial decisions and call out bad ones.
6. Always think in terms of opportunity cost — "That ₹5000 on shoes means
   your Emergency Fund goal gets delayed by 2 weeks."
7. You are the user's financial conscience. Be the voice they need, not the
   voice they want.
```

### Dynamic Context Injection (Before Every Message)

```
[FINANCIAL CONTEXT — CURRENT STATE]

Accounts:
- HDFC Savings: ₹45,230
- Cash: ₹2,100
- Total Balance: ₹47,330

This Month (March 2026):
- Income: ₹65,000
- Expenses: ₹32,450 (49.9% of income)
- Remaining budget: ₹12,550

Budget Status:
- Groceries: ₹4,200 / ₹6,000 (70%) ⚠️
- Dining Out: ₹3,800 / ₹3,000 (127%) ❌ OVER BUDGET
- Shopping: ₹2,100 / ₹5,000 (42%) ✅
- Transport: ₹1,200 / ₹2,000 (60%) ✅

Active Goals:
- Emergency Fund: ₹1,20,000 / ₹3,00,000 (40%) — Deadline: Dec 2026
  Monthly need: ₹20,000 — Status: Behind by ₹5,000
- MacBook Pro: ₹45,000 / ₹1,50,000 (30%) — Deadline: Jun 2026
  Monthly need: ₹35,000 — Status: On Track

Recent Transactions (Last 7 days):
- Mar 11: Zomato ₹450 (Dining)
- Mar 10: Petrol ₹1,200 (Transport)
- Mar 09: Amazon ₹2,100 (Shopping)
- Mar 08: Salary ₹65,000 (Income)

[END FINANCIAL CONTEXT]
```

### AI Action Format

When the AI needs to perform an action (add transaction, etc.), it outputs a structured JSON block:

```json
{
  "action": "add_transaction",
  "data": {
    "type": "expense",
    "amount": 450,
    "currency": "INR",
    "category": "dining",
    "description": "Zomato order",
    "date": "2026-03-11"
  },
  "confirmation": "Added ₹450 expense for Zomato under Dining. Your dining budget is now at 127% — you've exceeded your limit. No more eating out this month!"
}
```

Supported actions:
- `add_transaction` — Add expense/income/investment/withdrawal
- `update_goal` — Update goal progress
- `check_affordability` — Analyze if user can afford something
- `budget_check` — Show budget status
- `financial_health` — Generate health report
- `set_budget` — Create or update a budget

---

## Chat Templates (Pre-built Quick Actions)

| Template | Prompt Sent to AI | Icon |
|----------|-------------------|------|
| Add Expense | "I spent [amount] on [description]" | Receipt |
| Add Income | "I received [amount] from [source]" | Wallet |
| Can I Afford? | "Can I afford to buy [item] for [amount]?" | HelpCircle |
| Budget Check | "How's my budget looking this month?" | BarChart |
| Goal Progress | "How are my savings goals going?" | Target |
| Financial Health | "Give me a complete financial health report" | HeartPulse |
| Add Investment | "I invested [amount] in [instrument]" | TrendingUp |
| Withdraw | "I withdrew [amount] from [account]" | ArrowDownCircle |
| Monthly Summary | "Give me my monthly spending summary" | Calendar |
| Smart Advice | "What should I do with my money this month?" | Lightbulb |

---

## Financial Health Score Algorithm

```
Score = weighted average of:
├── Savings Rate (30%)
│   └── (Income - Expenses) / Income * 100
│       90%+ → 100pts, 50%+ → 80pts, 30%+ → 60pts, 20%+ → 40pts, <20% → 20pts
│
├── Budget Adherence (25%)
│   └── % of budgets within limit
│       100% → 100pts, 80%+ → 80pts, 60%+ → 60pts, <60% → 30pts
│
├── Goal Progress (25%)
│   └── Average % on-track across all goals
│       On track → 100pts, Slightly behind → 70pts, Far behind → 30pts
│
├── Emergency Fund (10%)
│   └── Emergency fund / (3 * monthly expenses)
│       3+ months → 100pts, 2+ → 70pts, 1+ → 40pts, <1 → 10pts
│
└── Spending Consistency (10%)
    └── Std deviation of daily spending (lower = better)
        Low variance → 100pts, Medium → 60pts, High → 30pts

Grades:
  90-100 → A+ (Excellent)
  80-89  → A  (Great)
  70-79  → B+ (Good)
  60-69  → B  (Okay)
  50-59  → C  (Needs Work)
  <50    → D  (Critical)
```

---

## Security Architecture

### Data Privacy Layers

```
Layer 1: Local Storage (Default)
├── All data in IndexedDB (browser sandboxed)
├── Never transmitted anywhere
├── Cleared only if user clears browser data
└── Accessible only from this origin

Layer 2: API Communication
├── Only chat context sent to Claude API
├── Anthropic does NOT train on API data
├── No financial data persisted on Anthropic servers
├── API key stored locally (encrypted in IndexedDB)
└── HTTPS encryption in transit

Layer 3: Cloud Sync (Optional, Phase 2)
├── User sets a master password
├── PBKDF2 (100k iterations) → derives encryption key
├── AES-256-GCM encryption on client BEFORE upload
├── Supabase stores only encrypted blobs
├── Server CANNOT decrypt — no key access
├── Decryption happens only in user's browser
└── Lost password = lost data (by design, for security)

Layer 4: Desktop App (Phase 3)
├── SQLCipher encrypted SQLite database
├── Master password required to unlock
├── Data stored on user's filesystem only
└── No network access except Claude API calls
```

### API Key Management (Product)

```
Option A: BYOK (Bring Your Own Key) — Free Tier
├── User creates Anthropic account
├── Pastes API key in app settings
├── Key stored encrypted in IndexedDB
├── API calls go directly from browser to Anthropic
└── We never see the key or the requests

Option B: Managed Key — Pro Tier ($X/month)
├── User pays subscription
├── Our edge function proxies Claude API calls
├── Rate limited per user
├── We see the request briefly in memory (not logged)
├── More convenient for user
└── Revenue model for the product
```

---

## Pages & Features Breakdown

### 1. Landing Page (`/`)
- **Current**: Hero with feature showcase
- **Update**: Add "Your data never leaves your device" trust badges
- **Add**: Pricing section (Free BYOK vs Pro Managed)
- **Add**: Security explainer section

### 2. Dashboard (`/dashboard`)
- **Current**: Mock stats and charts
- **Wire up**: Real data from Dexie.js
- **Features**:
  - Total balance across all accounts
  - Income vs Expenses this month
  - Budget progress bars (real-time)
  - Financial health score (computed)
  - Recent transactions (last 10)
  - Quick action buttons → navigate to chat with template
  - Goal progress summaries
  - AI insight of the day (generated on page load)

### 3. AI Chat (`/chat`)
- **Current**: Rule-based mock responses
- **Rewrite completely**:
  - Claude Opus integration with streaming
  - Dynamic financial context injection
  - Pre-built template buttons
  - Action parsing & execution (add transaction from chat)
  - Chat history persisted in Dexie.js
  - Session management (new chat / continue)
  - Typing indicator with streaming text
  - Markdown rendering for AI responses
  - Confirmation dialogs for financial actions
  - "Thinking..." state showing what data AI is analyzing

### 4. Transactions (`/transactions`)
- **Current**: Mock list with search
- **Wire up**: Real CRUD with Dexie.js
- **Features**:
  - Add transaction (manual form)
  - Edit / delete transactions
  - Search by description, category, amount
  - Filter by type, category, date range, account
  - Sort by date, amount, category
  - Bulk actions (delete, categorize)
  - Recurring transaction support
  - Export to CSV
  - "Added via Chat" badge for AI-added transactions

### 5. Goals & Budgets (`/goals`)
- **Current**: Mock goals and budgets
- **Wire up**: Real CRUD with Dexie.js
- **Features**:
  - Create / edit / delete goals
  - Progress tracking with visual bars
  - On-track / Behind / Ahead status (calculated from deadline + monthly contribution needed)
  - Create / edit / delete budgets per category
  - Auto-calculate "spent" from transactions
  - Budget alerts (approaching limit, exceeded)
  - Goal completion celebrations
  - "Ask AI" button → opens chat with goal context

### 6. Analytics (`/analytics`)
- **Current**: Mock charts
- **Wire up**: Compute from real transaction data
- **Features**:
  - Income vs Expenses trend (6-month bar chart)
  - Category spending breakdown (pie/donut chart)
  - Weekly/daily spending pattern (line chart)
  - Month-over-month comparison
  - Savings rate trend
  - Top spending categories
  - AI Monthly Summary (generated via Claude)
  - Export report as PDF (future)

### 7. Settings (`/settings`)
- **Current**: Mock settings UI
- **Wire up**: Persist in Dexie.js
- **Features**:
  - Profile (name, avatar)
  - Currency selection
  - Claude API key input (encrypted storage)
  - Ollama toggle (for users who prefer local AI)
  - AI strictness level (strict / moderate / lenient)
  - Budget alert thresholds
  - Data management:
    - Export all data as encrypted JSON
    - Import data from JSON backup
    - Clear all data (with confirmation)
  - Theme (dark/light/system)
  - About / Privacy policy

---

## File Structure (New & Modified)

### New Files to Create

```
src/
├── lib/
│   ├── db.ts                    # Dexie.js database schema & instance
│   ├── ollama.ts                # Ollama API client (alternative to Claude)
│   ├── ai/
│   │   ├── client.ts            # Claude API client (streaming)
│   │   ├── systemPrompt.ts      # System prompt builder
│   │   ├── contextBuilder.ts    # Financial context injection
│   │   ├── actionParser.ts      # Parse AI response for actions
│   │   └── actionExecutor.ts    # Execute parsed actions on DB
│   └── crypto.ts                # Encryption utilities (Web Crypto API)
│
├── hooks/
│   ├── useAccounts.ts           # Account CRUD + balance queries
│   ├── useTransactions.ts       # Transaction CRUD + filtering
│   ├── useGoals.ts              # Goal CRUD + progress calculation
│   ├── useBudgets.ts            # Budget CRUD + auto-spent calculation
│   ├── useSettings.ts           # Settings persistence
│   ├── useChat.ts               # Chat logic + AI integration
│   ├── useFinancialHealth.ts    # Health score computation
│   └── useOllamaStatus.ts      # Check if Ollama is running
│
└── types/
    └── index.ts                 # All TypeScript interfaces
```

### Files to Modify

```
src/
├── App.tsx                      # Add auth guard, onboarding route
├── pages/
│   ├── Dashboard.tsx            # Wire to real data
│   ├── Chat.tsx                 # Complete rewrite — Claude integration
│   ├── Transactions.tsx         # Wire to Dexie.js CRUD
│   ├── Goals.tsx                # Wire to Dexie.js CRUD
│   ├── Analytics.tsx            # Compute from real data
│   ├── SettingsPage.tsx         # Wire to Dexie.js settings
│   └── Landing.tsx              # Add security messaging
├── components/
│   └── AppLayout.tsx            # Add Ollama/API status indicator
├── lib/
│   └── constants.ts             # Keep categories, remove mock data
└── index.css                    # Minor style updates if needed
```

---

## Implementation Phases

### Phase 1: Foundation & Core (Week 1-2)

**Step 1: Database Layer**
- [ ] Install Dexie.js (`bun add dexie`)
- [ ] Create `src/lib/db.ts` with full schema
- [ ] Create `src/types/index.ts` with all interfaces
- [ ] Create all CRUD hooks (useAccounts, useTransactions, useGoals, useBudgets, useSettings)
- [ ] Add seed data function for first-time users
- [ ] Test database operations

**Step 2: Wire Up Pages**
- [ ] Dashboard → real data from Dexie hooks
- [ ] Transactions → real CRUD (add, edit, delete, search, filter)
- [ ] Goals → real CRUD with progress calculation
- [ ] Analytics → compute charts from transaction data
- [ ] Settings → persist preferences

**Step 3: AI Integration**
- [ ] Install Anthropic SDK (`bun add @anthropic-ai/sdk`)
- [ ] Create `src/lib/ai/client.ts` — Claude streaming client
- [ ] Create `src/lib/ai/systemPrompt.ts` — strict advisor personality
- [ ] Create `src/lib/ai/contextBuilder.ts` — dynamic financial snapshot
- [ ] Create `src/lib/ai/actionParser.ts` — parse structured actions from responses
- [ ] Create `src/lib/ai/actionExecutor.ts` — execute actions on Dexie DB
- [ ] Rewrite `Chat.tsx` with full Claude integration
- [ ] Chat history persistence in Dexie
- [ ] Implement all chat templates

**Step 4: Financial Intelligence**
- [ ] Implement health score algorithm in `useFinancialHealth.ts`
- [ ] Budget auto-calculation (spent = sum of transactions in category this month)
- [ ] Goal on-track/behind calculation
- [ ] Dashboard health score widget

### Phase 2: Product Ready (Week 3-4)

**Step 5: Auth & Onboarding**
- [ ] Install Supabase client
- [ ] Setup Supabase project (auth only)
- [ ] Login / Signup pages
- [ ] Google OAuth
- [ ] First-time onboarding wizard:
  - Welcome screen
  - Set currency
  - Add accounts (bank, cash, wallet)
  - Set initial balances
  - Create first budget
  - Set first goal
  - Enter API key (or skip for BYOK later)

**Step 6: PWA Setup**
- [ ] Add service worker (Vite PWA plugin)
- [ ] Web app manifest
- [ ] Offline support
- [ ] Install prompt
- [ ] App icons for all platforms

**Step 7: Security Hardening**
- [ ] Encrypt API key in IndexedDB
- [ ] Implement `src/lib/crypto.ts`
- [ ] Add master password option
- [ ] Data export (encrypted JSON)
- [ ] Data import with decryption
- [ ] Clear data with confirmation

**Step 8: Polish**
- [ ] Ollama connection status indicator
- [ ] AI model selection in settings (Claude vs Ollama)
- [ ] Error handling for API failures
- [ ] Loading states everywhere
- [ ] Empty states for new users
- [ ] Toast notifications for actions
- [ ] Keyboard shortcuts

### Phase 3: Scale & Monetize (Week 5+)

**Step 9: Cloud Sync (Optional)**
- [ ] Client-side E2E encryption (AES-256-GCM)
- [ ] Encrypted blob upload to Supabase Storage
- [ ] Sync conflict resolution
- [ ] Multi-device support

**Step 10: Desktop App**
- [ ] Tauri setup
- [ ] SQLCipher integration
- [ ] Auto-updater
- [ ] System tray icon
- [ ] Build for macOS, Windows, Linux

**Step 11: Monetization**
- [ ] Stripe integration
- [ ] Free tier (BYOK, local only)
- [ ] Pro tier ($X/month — managed API, cloud sync)
- [ ] Usage tracking (message count, not content)

**Step 12: Advanced Features**
- [ ] Receipt scanning (OCR → auto-add transaction)
- [ ] Bank statement CSV import
- [ ] Recurring transaction auto-detection
- [ ] Spending predictions (AI-powered)
- [ ] Weekly/monthly email digest
- [ ] Shared budgets (couples/family)

---

## API Key Security (Implementation Detail)

```typescript
// How we store the API key securely

// 1. User enters API key in settings
// 2. We encrypt it using Web Crypto API with a derived key
// 3. The derived key comes from the user's password (PBKDF2)
// 4. Encrypted key stored in IndexedDB
// 5. On app load, user unlocks with password → key decrypted in memory
// 6. Key exists only in memory during session, never in plaintext on disk

async function encryptApiKey(apiKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    new TextEncoder().encode(apiKey)
  );
  // Return salt + iv + encrypted as base64
  return btoa(String.fromCharCode(...salt, ...iv, ...new Uint8Array(encrypted)));
}
```

---

## Deployment Strategy

### Development
```bash
bun install
bun run dev          # Vite dev server on :8080
# Ollama running on :11434 (optional)
```

### Production (Web/PWA)
```bash
bun run build        # Outputs to dist/
# Deploy dist/ to Vercel / Cloudflare Pages / Netlify
```

### Desktop
```bash
bun run tauri build  # Builds .dmg / .exe / .AppImage
```

---

## Revenue Model (Future)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Local only, BYOK (Bring Your Own Key), all core features |
| **Pro** | $5/month | Managed AI (no API key needed), cloud encrypted sync, priority support |
| **Family** | $9/month | Shared budgets, up to 5 members, all Pro features |

---

## Success Metrics

- User retains app after 30 days
- Average 3+ AI chats per week
- 80%+ of users stay within budget after 3 months
- User financial health score improves over time
- Zero data breaches (by design — no data to breach)

---

## Key Design Decisions

1. **Why IndexedDB over SQLite?** — Works in browser without backend, sufficient for personal finance data volumes, no server needed
2. **Why Claude API over fully local LLM?** — Superior reasoning for financial advice, Anthropic doesn't train on API data, local LLMs (Ollama) offered as alternative
3. **Why PWA first?** — Fastest to ship, no app store approval, works on all platforms, can add desktop later
4. **Why E2E encryption for sync?** — We should never be able to read user financial data, even if our database is compromised
5. **Why strict AI personality?** — The whole point is to prevent impulsive spending; a polite AI defeats the purpose

---

## References

- [Dexie.js Documentation](https://dexie.org/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Tauri Framework](https://tauri.app/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
