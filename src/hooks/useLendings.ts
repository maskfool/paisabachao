import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Lending } from "@/types";

export function useLendings() {
  const lendings = useLiveQuery(() => db.lendings.orderBy("createdAt").reverse().toArray()) || [];

  const lent = lendings.filter((l) => l.type === "lent");
  const borrowed = lendings.filter((l) => l.type === "borrowed");

  const pendingLent = lent.filter((l) => l.status !== "settled");
  const pendingBorrowed = borrowed.filter((l) => l.status !== "settled");

  const totalLentOut = pendingLent.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalBorrowed = pendingBorrowed.reduce((sum, l) => sum + l.remainingAmount, 0);

  const addLending = async (data: Omit<Lending, "id" | "createdAt">, accountId?: number) => {
    const id = await db.lendings.add({ ...data, createdAt: new Date() });

    // Update bank account balance
    if (accountId) {
      const account = await db.accounts.get(accountId);
      if (account) {
        // Lent = money goes out (deduct), Borrowed = money comes in (add)
        const delta = data.type === "lent" ? -data.amount : data.amount;
        await db.accounts.update(accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }

    return id;
  };

  const updateLending = async (id: number, changes: Partial<Lending>) => {
    return db.lendings.update(id, changes);
  };

  const deleteLending = async (id: number) => {
    return db.lendings.delete(id);
  };

  const recordPayment = async (id: number, amount: number, accountId?: number) => {
    const lending = await db.lendings.get(id);
    if (!lending) return;
    const newRemaining = Math.max(0, lending.remainingAmount - amount);

    await db.lendings.update(id, {
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? "settled" : "partial",
    });

    // Update bank account — money comes back (lent) or goes out (borrowed)
    if (accountId) {
      const account = await db.accounts.get(accountId);
      if (account) {
        const delta = lending.type === "lent" ? amount : -amount;
        await db.accounts.update(accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }
  };

  const settle = async (id: number, accountId?: number) => {
    const lending = await db.lendings.get(id);
    if (!lending) return;
    const remaining = lending.remainingAmount;

    await db.lendings.update(id, { remainingAmount: 0, status: "settled" });

    // Return remaining amount to/from bank
    if (accountId && remaining > 0) {
      const account = await db.accounts.get(accountId);
      if (account) {
        const delta = lending.type === "lent" ? remaining : -remaining;
        await db.accounts.update(accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }
  };

  return {
    lendings,
    lent,
    borrowed,
    pendingLent,
    pendingBorrowed,
    totalLentOut,
    totalBorrowed,
    addLending,
    updateLending,
    deleteLending,
    recordPayment,
    settle,
  };
}
