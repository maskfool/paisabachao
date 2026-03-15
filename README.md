<div align="center">

<img src="public/pwa-192x192.svg" alt="PaisaBachao Logo" width="80" height="80" />

# PaisaBachao

### AI-Powered Personal Finance Tracker

**Track expenses. Set budgets. Achieve goals. Get AI-powered financial advice — all while keeping your data 100% private.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-paisabachao.in-7C3AED?style=for-the-badge&labelColor=1a1a2e)](https://paisabachao.in)
[![Built with React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Claude AI](https://img.shields.io/badge/Claude_AI-D97706?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)

<br />

<img src="https://img.shields.io/badge/Status-Production_Ready-22C55E?style=flat-square" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" />
<img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" />

</div>

---

## Features

<table>
<tr>
<td width="50%">

### Smart Dashboard
- Real-time financial overview
- Health score with letter grade (A-F)
- Budget progress tracking
- Savings goal visualization
- Income vs expense analysis

</td>
<td width="50%">

### AI Financial Advisor
- Powered by Claude AI (BYOK)
- Natural language queries
- Personalized spending advice
- Execute actions via chat
- 3 strictness levels

</td>
</tr>
<tr>
<td width="50%">

### Transaction Management
- Add, edit, delete transactions
- Search & multi-filter (type, date range)
- Recurring transactions (daily/weekly/monthly/yearly)
- Transfer between accounts
- Category-wise organization

</td>
<td width="50%">

### Goals & Budgets
- Create savings goals with deadlines
- Quick contribution buttons
- Budget alerts (warning at 80%, exceeded)
- Category-wise budget limits
- Visual progress tracking

</td>
</tr>
<tr>
<td width="50%">

### Analytics
- Expense breakdown (pie chart)
- Weekly spending trends (line chart)
- Financial health breakdown
- Category-wise analysis
- Monthly comparisons

</td>
<td width="50%">

### Privacy First
- **100% local storage** (IndexedDB)
- No server, no cloud, no tracking
- AES-256-GCM encrypted API keys
- Your data never leaves your browser
- BYOK (Bring Your Own Key) for AI

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- [Clerk](https://clerk.com/) account (free — for Google OAuth)
- [Claude API Key](https://console.anthropic.com/) (optional — for AI features)

### Setup

```bash
# Clone the repository
git clone https://github.com/maskfool/paisabachao.git
cd paisabachao

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk publishable key

# Start development server
bun run dev
```

Open [http://localhost:8080](http://localhost:8080) and you're ready to go!

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Framework** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Dexie.js (IndexedDB) — local-first |
| **AI** | @anthropic-ai/sdk (Claude Sonnet, BYOK) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Auth** | Clerk (Google OAuth) |
| **PWA** | Custom Service Worker + Web Manifest |
| **Security** | Web Crypto API (AES-GCM + PBKDF2) |
| **Deploy** | Cloudflare Pages |

---

## PWA Support

PaisaBachao works as a **Progressive Web App** — install it on your phone or desktop for a native-like experience:

- **Offline capable** — cached assets load instantly
- **Installable** — "Add to Home Screen" prompt
- **Fast** — code-split into 38+ chunks, ~126KB gzipped

---

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── AppLayout.tsx # Main app shell with sidebar
│   ├── ErrorBoundary.tsx
│   └── PageSkeleton.tsx
├── hooks/            # Custom React hooks
│   ├── useAccounts.ts
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   ├── useGoals.ts
│   ├── useChat.ts
│   ├── useRecurring.ts
│   └── ...
├── lib/
│   ├── ai/           # Claude AI integration
│   │   ├── client.ts
│   │   ├── contextBuilder.ts
│   │   └── systemPrompt.ts
│   ├── db.ts         # Dexie.js database schema
│   ├── crypto.ts     # AES-GCM encryption
│   └── validation.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Goals.tsx
│   ├── Analytics.tsx
│   ├── Chat.tsx
│   ├── SettingsPage.tsx
│   └── Onboarding.tsx
└── types/
    └── index.ts
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + N` | New transaction |
| `1` - `6` | Navigate pages |

---

## Roadmap

- [x] Core finance tracking (accounts, transactions, budgets, goals)
- [x] AI-powered financial advisor (Claude)
- [x] Onboarding wizard
- [x] PWA support
- [x] Recurring transactions
- [x] Variable income for freelancers
- [x] AES-256 encrypted API key storage
- [ ] Cloud sync (Supabase/Firebase)
- [ ] CSV / bank statement import
- [ ] Receipt scanner (AI-powered)
- [ ] Investment portfolio tracking
- [ ] UPI integration
- [ ] Ollama / local LLM support
- [ ] Desktop app (Tauri)

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

```bash
# Fork the repo, then:
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with love for smart money management**

<sub>PaisaBachao — Because every rupee counts</sub>

</div>
