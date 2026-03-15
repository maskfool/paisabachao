import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Budget, BudgetWithStatus } from "@/types";

export function useBudgets() {
  const budgets = useLiveQuery(() => db.budgets.toArray()) ?? [];

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get this month's transactions to compute actual spending per category
  const monthlyTransactions = useLiveQuery(
    () => db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .toArray(),
    [monthStart.getTime()]
  ) ?? [];

  const categorySpending = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const budgetsWithStatus: BudgetWithStatus[] = budgets.map((b) => {
    const spent = categorySpending[b.category] || 0;
    const percentage = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    const remaining = b.limit - spent;
    const isOver = remaining <= 0;
    const isWarning = percentage >= b.alertThreshold && !isOver;
    return { ...b, spent, percentage, remaining, isOver, isWarning };
  });

  async function addBudget(data: Omit<Budget, "id" | "createdAt" | "spent">) {
    return db.budgets.add({ ...data, spent: 0, createdAt: new Date() } as Budget);
  }

  async function updateBudget(id: number, changes: Partial<Budget>) {
    return db.budgets.update(id, changes);
  }

  async function deleteBudget(id: number) {
    return db.budgets.delete(id);
  }

  return { budgets: budgetsWithStatus, addBudget, updateBudget, deleteBudget };
}
