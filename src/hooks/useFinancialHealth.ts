import { useMemo } from "react";
import type { BudgetWithStatus, GoalWithStatus, FinancialHealthScore } from "@/types";

interface HealthInput {
  income: number;
  expenses: number;
  budgets: BudgetWithStatus[];
  goals: GoalWithStatus[];
  dailyExpenses: number[]; // Array of daily expense totals for the month
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

function savingsRateScore(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const rate = ((income - expenses) / income) * 100;
  if (rate >= 50) return 100;
  if (rate >= 30) return 80;
  if (rate >= 20) return 60;
  if (rate >= 10) return 40;
  return 20;
}

function budgetAdherenceScore(budgets: BudgetWithStatus[]): number {
  if (budgets.length === 0) return 70; // No budgets = neutral score
  const withinLimit = budgets.filter((b) => !b.isOver).length;
  const pct = (withinLimit / budgets.length) * 100;
  if (pct === 100) return 100;
  if (pct >= 80) return 80;
  if (pct >= 60) return 60;
  return 30;
}

function goalProgressScore(goals: GoalWithStatus[]): number {
  if (goals.length === 0) return 70;
  const onTrack = goals.filter((g) => g.isOnTrack).length;
  const pct = (onTrack / goals.length) * 100;
  if (pct >= 80) return 100;
  if (pct >= 50) return 70;
  return 30;
}

function emergencyFundScore(goals: GoalWithStatus[], monthlyExpenses: number): number {
  const ef = goals.find((g) => g.title.toLowerCase().includes("emergency"));
  if (!ef) return 30;
  const months = monthlyExpenses > 0 ? ef.currentAmount / monthlyExpenses : 0;
  if (months >= 3) return 100;
  if (months >= 2) return 70;
  if (months >= 1) return 40;
  return 10;
}

function spendingConsistencyScore(dailyExpenses: number[]): number {
  if (dailyExpenses.length <= 1) return 70;
  const mean = dailyExpenses.reduce((s, v) => s + v, 0) / dailyExpenses.length;
  if (mean === 0) return 100;
  const variance = dailyExpenses.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dailyExpenses.length;
  const cv = Math.sqrt(variance) / mean; // Coefficient of variation
  if (cv < 0.5) return 100;
  if (cv < 1) return 60;
  return 30;
}

export function useFinancialHealth(input: HealthInput): FinancialHealthScore {
  return useMemo(() => {
    const sr = savingsRateScore(input.income, input.expenses);
    const ba = budgetAdherenceScore(input.budgets);
    const gp = goalProgressScore(input.goals);
    const ef = emergencyFundScore(input.goals, input.expenses);
    const sc = spendingConsistencyScore(input.dailyExpenses);

    const total = Math.round(sr * 0.3 + ba * 0.25 + gp * 0.25 + ef * 0.1 + sc * 0.1);

    return {
      total,
      grade: getGrade(total),
      savingsRate: sr,
      budgetAdherence: ba,
      goalProgress: gp,
      emergencyFund: ef,
      spendingConsistency: sc,
    };
  }, [input.income, input.expenses, input.budgets, input.goals, input.dailyExpenses]);
}
