import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Transaction } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";

export interface TransactionFilters {
  search?: string;
  type?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  accountId?: number;
}

export function useTransactions(filters?: TransactionFilters) {
  const allTransactions = useLiveQuery(() =>
    db.transactions.orderBy("date").reverse().toArray()
  ) ?? [];

  const filtered = allTransactions.filter((tx) => {
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      if (!tx.description.toLowerCase().includes(q) && !tx.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters?.type && filters.type !== "all" && tx.type !== filters.type) return false;
    if (filters?.category && filters.category !== "all" && tx.category !== filters.category) return false;
    if (filters?.dateFrom && tx.date < filters.dateFrom) return false;
    if (filters?.dateTo && tx.date > filters.dateTo) return false;
    if (filters?.accountId && tx.accountId !== filters.accountId) return false;
    return true;
  });

  async function addTransaction(data: Omit<Transaction, "id" | "createdAt">) {
    const id = await db.transactions.add({ ...data, createdAt: new Date() } as Transaction);

    // Update account balance
    const delta = data.type === "income" ? data.amount
      : data.type === "expense" || data.type === "withdrawal" ? -data.amount
      : 0;
    if (delta !== 0) {
      const account = await db.accounts.get(data.accountId);
      if (account) {
        await db.accounts.update(data.accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }

    return id;
  }

  async function updateTransaction(id: number, changes: Partial<Transaction>) {
    return db.transactions.update(id, changes);
  }

  async function deleteTransaction(id: number) {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    // Reverse account balance change
    const delta = tx.type === "income" ? -tx.amount
      : tx.type === "expense" || tx.type === "withdrawal" ? tx.amount
      : 0;
    if (delta !== 0) {
      const account = await db.accounts.get(tx.accountId);
      if (account) {
        await db.accounts.update(tx.accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }

    return db.transactions.delete(id);
  }

  return { transactions: filtered, allTransactions, addTransaction, updateTransaction, deleteTransaction };
}

export function useMonthlyTransactions(date: Date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const transactions = useLiveQuery(
    () => db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .toArray(),
    [monthStart.getTime(), monthEnd.getTime()]
  ) ?? [];

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense" || t.type === "withdrawal")
    .reduce((s, t) => s + t.amount, 0);

  const investments = transactions
    .filter((t) => t.type === "investment")
    .reduce((s, t) => s + t.amount, 0);

  const categorySpending = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  return {
    transactions,
    income,
    expenses,
    investments,
    netSavings: income - expenses - investments,
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
    categorySpending,
  };
}
