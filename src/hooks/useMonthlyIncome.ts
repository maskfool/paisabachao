import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { format } from "date-fns";

/**
 * Hook for managing per-month income entries.
 * Useful for freelancers / variable income users.
 */
export function useMonthlyIncome(date: Date = new Date()) {
  const currentMonthKey = format(date, "yyyy-MM");

  const allIncomes = useLiveQuery(() =>
    db.monthlyIncomes.orderBy("month").reverse().toArray()
  ) ?? [];

  const currentIncome = allIncomes.find((i) => i.month === currentMonthKey);

  async function setIncome(amount: number, note?: string) {
    const existing = await db.monthlyIncomes.where("month").equals(currentMonthKey).first();
    if (existing) {
      return db.monthlyIncomes.update(existing.id!, {
        amount,
        note: note ?? existing.note,
      });
    }
    return db.monthlyIncomes.add({
      month: currentMonthKey,
      amount,
      currency: "INR",
      note,
      createdAt: new Date(),
    });
  }

  async function setIncomeForMonth(month: string, amount: number, note?: string) {
    const existing = await db.monthlyIncomes.where("month").equals(month).first();
    if (existing) {
      return db.monthlyIncomes.update(existing.id!, { amount, note: note ?? existing.note });
    }
    return db.monthlyIncomes.add({
      month,
      amount,
      currency: "INR",
      note,
      createdAt: new Date(),
    });
  }

  async function deleteIncome(id: number) {
    return db.monthlyIncomes.delete(id);
  }

  return {
    currentIncome,
    allIncomes,
    setIncome,
    setIncomeForMonth,
    deleteIncome,
    currentMonthKey,
  };
}
