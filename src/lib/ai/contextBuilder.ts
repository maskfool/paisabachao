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
  const today = now.getDate();
  const daysInMonth = monthEnd.getDate();
  const daysLeft = daysInMonth - today;

  // Fetch all data in parallel
  const [accounts, monthlyTx, goals, budgets, settings, monthlyIncomeEntry, emis, lendings] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.where("date").between(monthStart, monthEnd, true, true).toArray(),
    db.goals.where("status").equals("active").toArray(),
    db.budgets.toArray(),
    db.settings.toArray(),
    db.monthlyIncomes.where("month").equals(currentMonthKey).first(),
    db.emis.where("status").equals("active").toArray(),
    db.lendings.toArray(),
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

  // Separate bank accounts and credit cards
  const bankAccounts = accounts.filter((a) => a.type !== "credit_card");
  const creditCards = accounts.filter((a) => a.type === "credit_card");

  const bankBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const bankLines = bankAccounts
    .map((a) => `- ${a.name} (${a.type}): ₹${a.balance.toLocaleString("en-IN")}`)
    .join("\n");

  // Credit card details
  const ccLines = creditCards.map((cc) => {
    const outstanding = Math.max(0, -cc.balance);
    const limit = cc.creditLimit ?? 0;
    const utilization = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
    const linkedEMIs = emis.filter((e) => e.creditCardAccountId === cc.id);
    const emiInfo = linkedEMIs.length > 0
      ? ` | EMIs: ${linkedEMIs.map((e) => `${e.name} ₹${e.emiAmount.toLocaleString("en-IN")}/mo`).join(", ")}`
      : "";
    const billingInfo = cc.billingDate ? ` | Bill: ${cc.billingDate}th` : "";
    const dueInfo = cc.dueDate ? ` | Due: ${cc.dueDate}th` : "";
    return `- ${cc.name}: Outstanding ₹${outstanding.toLocaleString("en-IN")} / Limit ₹${limit.toLocaleString("en-IN")} (${utilization}% used)${billingInfo}${dueInfo}${emiInfo}`;
  }).join("\n");

  const totalCCOutstanding = creditCards.reduce((s, cc) => s + Math.max(0, -cc.balance), 0);
  const totalCCLimit = creditCards.reduce((s, cc) => s + (cc.creditLimit ?? 0), 0);
  const avgUtilization = totalCCLimit > 0 ? Math.round((totalCCOutstanding / totalCCLimit) * 100) : 0;

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

  // Burn rate
  const daysElapsed = Math.max(1, today);
  const dailyBurnRate = expenses > 0 ? Math.round(expenses / daysElapsed) : 0;
  const projectedMonthEnd = bankBalance - (dailyBurnRate * daysLeft);

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
    const daysLeftGoal = Math.max(0, Math.round((g.deadline.getTime() - now.getTime()) / 86400000));
    const monthsLeft = Math.max(1, daysLeftGoal / 30);
    const monthlyNeeded = Math.round((g.targetAmount - g.currentAmount) / monthsLeft);
    return `- ${g.title}: ₹${g.currentAmount.toLocaleString("en-IN")} / ₹${g.targetAmount.toLocaleString("en-IN")} (${pct}%) — Deadline: ${format(g.deadline, "MMM yyyy")} — Need ₹${monthlyNeeded.toLocaleString("en-IN")}/month`;
  }).join("\n");

  // EMI summary
  const totalMonthlyEMI = emis.reduce((s, e) => s + e.emiAmount, 0);
  const emiLines = emis.map((e) => {
    const remaining = e.tenureMonths - e.paidCount;
    const totalRemaining = remaining * e.emiAmount;
    const pct = Math.round((e.paidCount / e.tenureMonths) * 100);
    return `- ${e.name} (${e.type}): ₹${e.emiAmount.toLocaleString("en-IN")}/mo | ${e.paidCount}/${e.tenureMonths} paid (${pct}%) | ₹${totalRemaining.toLocaleString("en-IN")} remaining | Due: ${e.dueDay}th | ${e.interestRate}% p.a.`;
  }).join("\n");

  // Lending summary
  const pendingLent = lendings.filter((l) => l.type === "lent" && l.status !== "settled");
  const pendingBorrowed = lendings.filter((l) => l.type === "borrowed" && l.status !== "settled");
  const totalLentOut = pendingLent.reduce((s, l) => s + l.remainingAmount, 0);
  const totalBorrowedAmt = pendingBorrowed.reduce((s, l) => s + l.remainingAmount, 0);

  const lendingLines = [...pendingLent, ...pendingBorrowed].map((l) => {
    const direction = l.type === "lent" ? "Gave to" : "Owe to";
    const dueStr = l.dueDate ? ` | Due: ${format(new Date(l.dueDate), "MMM dd")}` : "";
    const isOverdue = l.dueDate && new Date(l.dueDate) < now ? " OVERDUE" : "";
    return `- ${direction} ${l.personName}: ₹${l.remainingAmount.toLocaleString("en-IN")} (${l.status})${dueStr}${isOverdue}`;
  }).join("\n");

  // EMI to income ratio
  const emiToIncomeRatio = declaredIncome > 0 ? Math.round((totalMonthlyEMI / declaredIncome) * 100) : 0;

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

  // Net worth calculation
  const totalEMIRemaining = emis.reduce((s, e) => s + (e.tenureMonths - e.paidCount) * e.emiAmount, 0);
  const netWorth = bankBalance - totalCCOutstanding - totalEMIRemaining + totalLentOut - totalBorrowedAmt;

  return `[FINANCIAL CONTEXT — CURRENT STATE]

User: ${userName}
Date: ${format(now, "MMMM d, yyyy")} (Day ${today} of ${daysInMonth}, ${daysLeft} days left)
Income Type: ${isFreelancer ? "Variable (Freelancer)" : "Fixed"}
Declared Monthly Income: ₹${declaredIncome.toLocaleString("en-IN")}

Bank Accounts:
${bankLines || "- No accounts set up"}
Total Bank Balance: ₹${bankBalance.toLocaleString("en-IN")}

Credit Cards:
${ccLines || "- No credit cards"}
Total Outstanding: ₹${totalCCOutstanding.toLocaleString("en-IN")} / Total Limit: ₹${totalCCLimit.toLocaleString("en-IN")} (${avgUtilization}% utilization)

EMIs & Loans (${emis.length} active):
${emiLines || "- No active EMIs"}
Total Monthly EMI: ₹${totalMonthlyEMI.toLocaleString("en-IN")} | EMI-to-Income: ${emiToIncomeRatio}%

Lendings:
${lendingLines || "- No pending lendings"}
Money Given Out: ₹${totalLentOut.toLocaleString("en-IN")} | Money Owed: ₹${totalBorrowedAmt.toLocaleString("en-IN")}

This Month (${format(now, "MMMM yyyy")}):
- Recorded Income: ₹${income.toLocaleString("en-IN")}
- Expenses: ₹${expenses.toLocaleString("en-IN")}
- Investments: ₹${investments.toLocaleString("en-IN")}
- Net: ₹${(income - expenses - investments).toLocaleString("en-IN")}
- Savings Rate: ${savingsRate}%
- Daily Burn Rate: ₹${dailyBurnRate.toLocaleString("en-IN")}/day
- Projected Month-End Bank Balance: ₹${projectedMonthEnd.toLocaleString("en-IN")}

Net Worth: ₹${netWorth.toLocaleString("en-IN")} (Bank - CC Outstanding - Loan Remaining + Money Lent - Money Owed)
Net Balance (Bank + CC): ₹${totalBalance.toLocaleString("en-IN")}

Budget Status:
${budgetLines || "- No budgets configured"}

Active Goals:
${goalLines || "- No active goals"}

Recent Transactions (Last 7 days):
${recentTx || "- No recent transactions"}

[END FINANCIAL CONTEXT]`;
}
