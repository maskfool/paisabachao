import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { EMI } from "@/types";

export function useEMIs() {
  const emis = useLiveQuery(() => db.emis.orderBy("createdAt").reverse().toArray()) || [];

  const activeEMIs = emis.filter((e) => e.status === "active");
  const completedEMIs = emis.filter((e) => e.status === "completed");

  const totalMonthlyEMI = activeEMIs.reduce((sum, e) => sum + e.emiAmount, 0);
  const totalOutstanding = activeEMIs.reduce((sum, e) => {
    const remaining = e.tenureMonths - e.paidCount;
    return sum + remaining * e.emiAmount;
  }, 0);

  const addEMI = async (data: Omit<EMI, "id" | "createdAt">) => {
    return db.emis.add({ ...data, createdAt: new Date() });
  };

  const updateEMI = async (id: number, changes: Partial<EMI>) => {
    return db.emis.update(id, changes);
  };

  const deleteEMI = async (id: number) => {
    return db.emis.delete(id);
  };

  const payEMI = async (id: number) => {
    const emi = await db.emis.get(id);
    if (!emi) return;
    const newPaidCount = emi.paidCount + 1;
    const updates: Partial<EMI> = { paidCount: newPaidCount, lastPaidDate: new Date() };
    if (newPaidCount >= emi.tenureMonths) {
      updates.status = "completed";
    }
    return db.emis.update(id, updates);
  };

  return {
    emis,
    activeEMIs,
    completedEMIs,
    totalMonthlyEMI,
    totalOutstanding,
    addEMI,
    updateEMI,
    deleteEMI,
    payEMI,
  };
}
