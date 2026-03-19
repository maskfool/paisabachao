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
  // Credit card specific (only when type === "credit_card")
  creditLimit?: number;
  billingDate?: number; // day of month (1-31) statement generates
  dueDate?: number; // day of month payment is due (1-31)
  minimumDuePercentage?: number; // e.g. 5 = 5% of outstanding
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

export interface EMI {
  id?: number;
  name: string;
  type: "car" | "home" | "personal" | "electronics" | "consumer" | "education" | "two_wheeler" | "other";
  lender: string;
  totalAmount: number;
  emiAmount: number;
  interestRate: number;
  tenureMonths: number;
  paidCount: number;
  startDate: Date;
  dueDay: number; // 1-31, day of month EMI is due
  currency: string;
  status: "active" | "completed";
  notes?: string;
  creditCardAccountId?: number; // link EMI to a credit card
  lastPaidDate?: Date; // tracks when Mark Paid was last clicked
  createdAt: Date;
}

export interface Lending {
  id?: number;
  type: "lent" | "borrowed";
  personName: string;
  amount: number;
  remainingAmount: number;
  description: string;
  date: Date;
  dueDate?: Date;
  status: "pending" | "partial" | "settled";
  currency: string;
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

export interface CreditCardSummary extends Account {
  outstanding: number;
  availableLimit: number;
  utilizationPercent: number;
  minimumDue: number;
  linkedEMIs: EMI[];
  emiMonthlyTotal: number;
  nextBillingDate: Date | null;
  nextDueDate: Date | null;
}

export interface MonthlySnapshot {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  netSavings: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
}
