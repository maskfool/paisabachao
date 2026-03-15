import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Account } from "@/types";

export function useAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray()) ?? [];

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  async function addAccount(data: Omit<Account, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    return db.accounts.add({ ...data, createdAt: now, updatedAt: now } as Account);
  }

  async function updateAccount(id: number, changes: Partial<Account>) {
    return db.accounts.update(id, { ...changes, updatedAt: new Date() });
  }

  async function deleteAccount(id: number) {
    return db.accounts.delete(id);
  }

  async function updateBalance(id: number, delta: number) {
    const account = await db.accounts.get(id);
    if (!account) return;
    return db.accounts.update(id, {
      balance: account.balance + delta,
      updatedAt: new Date(),
    });
  }

  return { accounts, totalBalance, addAccount, updateAccount, deleteAccount, updateBalance };
}
