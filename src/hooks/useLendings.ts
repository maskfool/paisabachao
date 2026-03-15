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

  const addLending = async (data: Omit<Lending, "id" | "createdAt">) => {
    return db.lendings.add({ ...data, createdAt: new Date() });
  };

  const updateLending = async (id: number, changes: Partial<Lending>) => {
    return db.lendings.update(id, changes);
  };

  const deleteLending = async (id: number) => {
    return db.lendings.delete(id);
  };

  const recordPayment = async (id: number, amount: number) => {
    const lending = await db.lendings.get(id);
    if (!lending) return;
    const newRemaining = Math.max(0, lending.remainingAmount - amount);
    return db.lendings.update(id, {
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? "settled" : "partial",
    });
  };

  const settle = async (id: number) => {
    return db.lendings.update(id, { remainingAmount: 0, status: "settled" });
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
