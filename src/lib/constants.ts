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

// Types are now in src/types/index.ts
// Mock data removed — app uses Dexie.js (IndexedDB) for real data
