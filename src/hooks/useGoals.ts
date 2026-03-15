import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Goal, GoalWithStatus } from "@/types";

export function useGoals() {
  const goals = useLiveQuery(() => db.goals.toArray()) ?? [];

  const goalsWithStatus: GoalWithStatus[] = goals.map((g) => {
    const percentage = Math.round((g.currentAmount / g.targetAmount) * 100);
    const daysLeft = Math.max(0, Math.round((g.deadline.getTime() - Date.now()) / 86400000));
    const remaining = g.targetAmount - g.currentAmount;
    const monthsLeft = Math.max(1, daysLeft / 30);
    const monthlyNeeded = Math.round(remaining / monthsLeft);

    // On track if current progress percentage >= expected percentage based on time elapsed
    const totalDays = Math.max(1, Math.round((g.deadline.getTime() - g.createdAt.getTime()) / 86400000));
    const elapsed = totalDays - daysLeft;
    const expectedPercentage = (elapsed / totalDays) * 100;
    const isOnTrack = percentage >= expectedPercentage * 0.85; // 15% grace margin

    return { ...g, percentage, daysLeft, monthlyNeeded, isOnTrack };
  });

  const activeGoals = goalsWithStatus.filter((g) => g.status === "active");

  async function addGoal(data: Omit<Goal, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    return db.goals.add({ ...data, createdAt: now, updatedAt: now } as Goal);
  }

  async function updateGoal(id: number, changes: Partial<Goal>) {
    return db.goals.update(id, { ...changes, updatedAt: new Date() });
  }

  async function contributeToGoal(id: number, amount: number) {
    const goal = await db.goals.get(id);
    if (!goal) return;
    const newAmount = goal.currentAmount + amount;
    const status = newAmount >= goal.targetAmount ? "completed" : goal.status;
    return db.goals.update(id, {
      currentAmount: newAmount,
      status,
      updatedAt: new Date(),
    });
  }

  async function deleteGoal(id: number) {
    return db.goals.delete(id);
  }

  return { goals: goalsWithStatus, activeGoals, addGoal, updateGoal, contributeToGoal, deleteGoal };
}
