# PaisaBachao — AI Finance App

## Quick Start
```bash
bun install
cp .env.example .env.local   # Add your Clerk publishable key
bun run dev                   # Vite dev server
bun run build                 # Production build
bun run test                  # Run tests
```

## Project Context
Read these files to understand the project:
- **`PROGRESS.md`** — Current build status, what's done, what's pending, known gaps
- **`project_plan.md`** — Full architecture, database schema, AI system prompt strategy, implementation phases with checkboxes

## Architecture
- **Privacy-first**: All financial data stored locally in IndexedDB via Dexie.js. No backend for data.
- **Auth**: Clerk (Google OAuth). Publishable key in `VITE_CLERK_PUBLISHABLE_KEY` env var.
- **AI advisor**: Claude API called directly from browser (BYOK — user provides their own API key in Settings).
- **Currency**: INR is the base currency. All amounts stored in INR. Users can select a display currency and enter a manual conversion rate in Settings. Use `useCurrency().format(amount)` everywhere — never hardcode currency symbols.
- **Reactive data**: Dexie live queries power all UI — changes to DB auto-update components.

## Key Directories
```
src/types/index.ts          — All TypeScript interfaces
src/lib/db.ts               — Dexie database schema + seed function (all amounts in INR)
src/lib/ai/                 — AI modules (client, systemPrompt, contextBuilder, actionParser, actionExecutor)
src/lib/constants.ts        — Categories and currencies (no mock data)
src/hooks/                  — Data hooks (useAccounts, useTransactions, useGoals, useBudgets, useSettings, useChat, useFinancialHealth, useCurrency)
src/pages/                  — Route pages (Dashboard, Chat, Transactions, Goals, Analytics, Settings, Landing, SSOCallback)
src/components/AuthGuard.tsx — Protects routes, redirects to / if not signed in
src/components/AppLayout.tsx — Sidebar with Clerk user info + sign out
src/components/ui/          — shadcn/ui components (don't modify these)
```

## Conventions
- Use Dexie hooks (`useLiveQuery`) for reactive data — never manual state for DB data
- Transactions auto-update account balances on add/delete
- Budget "spent" is computed from transactions, never stored manually
- AI actions use ```action code blocks parsed by actionParser.ts
- All dates in DB are `Date` objects, not strings
- **All amounts in DB are in INR** — use `useCurrency().format()` or `useCurrency().convert()` for display
- Keep all financial data local — never send to any server except Claude API for chat
- Auth is handled by Clerk — use `useUser()`, `useAuth()`, `useClerk()` from `@clerk/clerk-react`
