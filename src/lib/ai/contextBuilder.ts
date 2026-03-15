import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, format, subDays } from "date-fns";
import { CATEGORIES } from "@/lib/constants";

const getCategoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label || id;

export async function buildFinancialContext(): Promise<string> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentMonthKey = format(now, "yyyy-MM");

  // Fetch all data in parallel
  const [accounts, monthlyTx, goals, budgets, settings, monthlyIncomeEntry] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.where("date").between(monthStart, monthEnd, true, true).toArray(),
    db.goals.where("status").equals("active").toArray(),
    db.budgets.toArray(),
    db.settings.toArray(),
    db.monthlyIncomes.where("month").equals(currentMonthKey).first(),
  ]);

  const settingsMap = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  // Monthly income — prefer per-month entry, fall back to default
  const declaredIncome = monthlyIncomeEntry?.amount
    ? monthlyIncomeEntry.amount
    : settingsMap.monthlyIncome
      ? parseFloat(settingsMap.monthlyIncome)
      : 0;

  // Account balances
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const accountLines = accounts
    .map((a) => `- ${a.name} (${a.type}): ₹${a.balance.toLocaleString("en-IN")}`)
    .join("\n");

  // Monthly aggregates
  const income = monthlyTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTx
    .filter((t) => t.type === "expense" || t.type === "withdrawal")
    .reduce((s, t) => s + t.amount, 0);
  const investments = monthlyTx
    .filter((t) => t.type === "investment")
    .reduce((s, t) => s + t.amount, 0);

  // Category spending
  const catSpending: Record<string, number> = {};
  monthlyTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    });

  // Budget status
  const budgetLines = budgets.map((b) => {
    const spent = catSpending[b.category] || 0;
    const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    const status = pct >= 100 ? "OVER BUDGET" : pct >= 80 ? "WARNING" : "OK";
    return `- ${getCategoryLabel(b.category)}: ₹${spent.toFixed(0)} / ₹${b.limit} (${pct}%) ${status}`;
  }).join("\n");

  // Goals
  const goalLines = goals.map((g) => {
    const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
    const daysLeft = Math.max(0, Math.round((g.deadline.getTime() - now.getTime()) / 86400000));
    const monthsLeft = Math.max(1, daysLeft / 30);
    const monthlyNeeded = Math.round((g.targetAmount - g.currentAmount) / monthsLeft);
    return `- ${g.title}: ₹${g.currentAmount.toLocaleString("en-IN")} / ₹${g.targetAmount.toLocaleString("en-IN")} (${pct}%) — Deadline: ${format(g.deadline, "MMM yyyy")} — Need ₹${monthlyNeeded.toLocaleString("en-IN")}/month`;
  }).join("\n");

  // Recent transactions (last 7 days)
  const weekAgo = subDays(now, 7);
  const recentTx = monthlyTx
    .filter((t) => t.date >= weekAgo)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
    .map((t) => {
      const sign = t.type === "income" ? "+" : "-";
      return `- ${format(t.date, "MMM dd")}: ${t.description} ${sign}₹${t.amount.toLocaleString("en-IN")} (${getCategoryLabel(t.category)})`;
    })
    .join("\n");

  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const userName = settingsMap.name || "User";
  const isFreelancer = settingsMap.incomeType === "variable";

  return `[FINANCIAL CONTEXT — CURRENT STATE]

User: ${userName}
Date: ${format(now, "MMMM d, yyyy")}
Income Type: ${isFreelancer ? "Variable (Freelancer)" : "Fixed"}
Declared Monthly Income: ₹${declaredIncome.toLocaleString("en-IN")}

Accounts:
${accountLines || "- No accounts set up"}
Total Balance: ₹${totalBalance.toLocaleString("en-IN")}

This Month (${format(now, "MMMM yyyy")}):
- Recorded Income: ₹${income.toLocaleString("en-IN")}
- Expenses: ₹${expenses.toLocaleString("en-IN")}
- Investments: ₹${investments.toLocaleString("en-IN")}
- Net: ₹${(income - expenses - investments).toLocaleString("en-IN")}
- Savings Rate: ${savingsRate}%

Budget Status:
${budgetLines || "- No budgets configured"}

Active Goals:
${goalLines || "- No active goals"}

Recent Transactions (Last 7 days):
${recentTx || "- No recent transactions"}

[END FINANCIAL CONTEXT]`;
}
