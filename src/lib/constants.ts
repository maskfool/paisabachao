import {
  ShoppingCart, Home, Zap, Monitor, Stethoscope, GraduationCap, Car, UtensilsCrossed,
  ShoppingBag, Shield, TrendingUp, Gift, Plane, Sparkles, Dumbbell, Dog, PiggyBank,
  CreditCard, MoreHorizontal, Wifi, Music, Baby, Scissors, Fuel, BookOpen
} from "lucide-react";

export const CATEGORIES = [
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "hsl(152 60% 42%)" },
  { id: "rent", label: "Rent", icon: Home, color: "hsl(210 100% 52%)" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "hsl(38 92% 50%)" },
  { id: "subscriptions", label: "Subscriptions", icon: Monitor, color: "hsl(280 65% 60%)" },
  { id: "entertainment", label: "Entertainment", icon: Music, color: "hsl(330 80% 55%)" },
  { id: "healthcare", label: "Healthcare", icon: Stethoscope, color: "hsl(0 72% 51%)" },
  { id: "education", label: "Education", icon: GraduationCap, color: "hsl(200 80% 50%)" },
  { id: "transport", label: "Transport", icon: Car, color: "hsl(25 90% 50%)" },
  { id: "dining", label: "Dining Out", icon: UtensilsCrossed, color: "hsl(350 70% 50%)" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "hsl(260 60% 55%)" },
  { id: "insurance", label: "Insurance", icon: Shield, color: "hsl(180 50% 40%)" },
  { id: "investments", label: "Investments", icon: TrendingUp, color: "hsl(152 55% 48%)" },
  { id: "gifts", label: "Gifts", icon: Gift, color: "hsl(340 75% 55%)" },
  { id: "travel", label: "Travel", icon: Plane, color: "hsl(195 80% 45%)" },
  { id: "personal_care", label: "Personal Care", icon: Sparkles, color: "hsl(300 50% 55%)" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "hsl(15 85% 50%)" },
  { id: "pets", label: "Pets", icon: Dog, color: "hsl(30 60% 45%)" },
  { id: "savings", label: "Savings", icon: PiggyBank, color: "hsl(152 60% 42%)" },
  { id: "debt", label: "Debt Payments", icon: CreditCard, color: "hsl(0 60% 45%)" },
  { id: "fuel", label: "Fuel", icon: Fuel, color: "hsl(45 80% 45%)" },
  { id: "internet", label: "Internet/WiFi", icon: Wifi, color: "hsl(220 70% 50%)" },
  { id: "childcare", label: "Childcare", icon: Baby, color: "hsl(320 60% 55%)" },
  { id: "grooming", label: "Grooming", icon: Scissors, color: "hsl(270 40% 50%)" },
  { id: "books", label: "Books", icon: BookOpen, color: "hsl(35 50% 40%)" },
  { id: "misc", label: "Miscellaneous", icon: MoreHorizontal, color: "hsl(220 10% 50%)" },
] as const;

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
] as const;

export type TransactionType = "expense" | "income" | "investment" | "withdrawal";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  category: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  currency: string;
  period: "monthly" | "yearly";
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", type: "expense", amount: 85.50, currency: "USD", category: "groceries", description: "Weekly grocery run", date: "2026-03-09" },
  { id: "2", type: "income", amount: 5200, currency: "USD", category: "misc", description: "Monthly salary", date: "2026-03-01" },
  { id: "3", type: "expense", amount: 1200, currency: "USD", category: "rent", description: "March rent", date: "2026-03-01" },
  { id: "4", type: "expense", amount: 45.99, currency: "USD", category: "subscriptions", description: "Netflix + Spotify", date: "2026-03-05" },
  { id: "5", type: "expense", amount: 32.00, currency: "USD", category: "dining", description: "Dinner with friends", date: "2026-03-08" },
  { id: "6", type: "investment", amount: 500, currency: "USD", category: "investments", description: "S&P 500 index fund", date: "2026-03-02" },
  { id: "7", type: "expense", amount: 60.00, currency: "USD", category: "fuel", description: "Gas fill-up", date: "2026-03-07" },
  { id: "8", type: "expense", amount: 120, currency: "USD", category: "utilities", description: "Electricity bill", date: "2026-03-03" },
  { id: "9", type: "expense", amount: 25.00, currency: "USD", category: "entertainment", description: "Movie tickets", date: "2026-03-06" },
  { id: "10", type: "expense", amount: 200, currency: "USD", category: "shopping", description: "New running shoes", date: "2026-03-04" },
  { id: "11", type: "withdrawal", amount: 300, currency: "USD", category: "misc", description: "ATM withdrawal", date: "2026-03-08" },
  { id: "12", type: "expense", amount: 75, currency: "USD", category: "healthcare", description: "Doctor visit copay", date: "2026-03-06" },
];

export const MOCK_GOALS: Goal[] = [
  { id: "1", title: "Emergency Fund", targetAmount: 10000, currentAmount: 6500, currency: "USD", deadline: "2026-12-31", category: "savings" },
  { id: "2", title: "Vacation to Japan", targetAmount: 5000, currentAmount: 2200, currency: "USD", deadline: "2026-09-01", category: "travel" },
  { id: "3", title: "New Laptop", targetAmount: 2000, currentAmount: 800, currency: "USD", deadline: "2026-06-15", category: "shopping" },
  { id: "4", title: "Student Loan Payoff", targetAmount: 15000, currentAmount: 9000, currency: "USD", deadline: "2027-06-01", category: "debt" },
];

export const MOCK_BUDGETS: Budget[] = [
  { id: "1", category: "groceries", limit: 400, spent: 285, currency: "USD", period: "monthly" },
  { id: "2", category: "dining", limit: 150, spent: 132, currency: "USD", period: "monthly" },
  { id: "3", category: "entertainment", limit: 100, spent: 25, currency: "USD", period: "monthly" },
  { id: "4", category: "shopping", limit: 200, spent: 200, currency: "USD", period: "monthly" },
  { id: "5", category: "transport", limit: 150, spent: 60, currency: "USD", period: "monthly" },
  { id: "6", category: "subscriptions", limit: 60, spent: 45.99, currency: "USD", period: "monthly" },
  { id: "7", category: "utilities", limit: 200, spent: 120, currency: "USD", period: "monthly" },
  { id: "8", category: "healthcare", limit: 150, spent: 75, currency: "USD", period: "monthly" },
];
