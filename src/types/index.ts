// ===== Database Entity Types =====

export interface Account {
  id?: number;
  name: string;
  type: "bank" | "cash" | "wallet" | "credit_card";
  balance: number;
  currency: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id?: number;
  type: "expense" | "income" | "investment" | "withdrawal" | "transfer";
  amount: number;
  currency: string;
  category: string;
  description: string;
  accountId: number;
  date: Date;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  createdAt: Date;
  addedVia: "chat" | "manual";
}

export interface Goal {
  id?: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: Date;
  category: string;
  priority: "high" | "medium" | "low";
  status: "active" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id?: number;
  category: string;
  limit: number;
  spent: number;
  currency: string;
  period: "monthly" | "yearly";
  alertThreshold: number;
  createdAt: Date;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  sessionId: string;
}

export interface UserSettings {
  id?: number;
  key: string;
  value: string;
  updatedAt: Date;
}

export interface MonthlyIncome {
  id?: number;
  month: string; // "2026-03" format (YYYY-MM)
  amount: number;
  currency: string;
  note?: string;
  createdAt: Date;
}

// ===== AI Action Types =====

export type AIActionType =
  | "add_transaction"
  | "update_goal"
  | "check_affordability"
  | "budget_check"
  | "financial_health"
  | "set_budget";

export interface AIAction {
  action: AIActionType;
  data: Record<string, unknown>;
  confirmation: string;
}

// ===== Derived / Computed Types =====

export interface BudgetWithStatus extends Budget {
  percentage: number;
  remaining: number;
  isOver: boolean;
  isWarning: boolean;
}

export interface GoalWithStatus extends Goal {
  percentage: number;
  daysLeft: number;
  monthlyNeeded: number;
  isOnTrack: boolean;
}

export interface FinancialHealthScore {
  total: number;
  grade: string;
  savingsRate: number;
  budgetAdherence: number;
  goalProgress: number;
  emergencyFund: number;
  spendingConsistency: number;
}

export interface MonthlySnapshot {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  netSavings: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
}
