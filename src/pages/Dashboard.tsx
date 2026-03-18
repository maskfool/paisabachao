import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  TrendingUp, TrendingDown, DollarSign, Plus, MessageSquare,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES } from "@/lib/constants";
import { useAccounts } from "@/hooks/useAccounts";
import { useMonthlyTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useGoals } from "@/hooks/useGoals";
import { useFinancialHealth } from "@/hooks/useFinancialHealth";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { useRecurringTransactions } from "@/hooks/useRecurring";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

function HealthScore({ grade, score }: { grade: string; score: number }) {
  const tip = score >= 80 ? "Great financial health!" :
    score >= 60 ? "Good shape! Cut overspending to improve." :
    "Needs attention. Review your budgets.";
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Financial Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-gradient">{grade}</span>
          <span className="text-sm text-muted-foreground mb-1.5">{score}/100</span>
        </div>
        <Progress value={score} className="mt-3 h-2" />
        <p className="text-xs text-muted-foreground mt-2">{tip}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, change, positive, icon: Icon }: { title: string; value: string; change: string; positive: boolean; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {positive ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
          <span className={`text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { settings, setSetting } = useSettings();
  useRecurringTransactions();
  const { totalBalance } = useAccounts();
  const { transactions, income, expenses, savingsRate } = useMonthlyTransactions();
  const { budgets } = useBudgets();
  const { activeGoals } = useGoals();
  const { format: fmt } = useCurrency();

  // Redirect to onboarding if not completed
  const settingsLoaded = Object.keys(settings).length > 0;
  const hasUserData = !!(settings.name || settings.apiKey || settings.monthlyIncome || totalBalance > 0);
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.onboardingComplete === "true") return;
    // Existing users who have any meaningful data — auto-mark complete
    if (hasUserData) {
      setSetting("onboardingComplete", "true");
      return;
    }
    // Truly new user — redirect to onboarding
    navigate("/onboarding", { replace: true });
  }, [settingsLoaded, settings.onboardingComplete, hasUserData, navigate, setSetting]);

  const userName = user?.firstName || settings.name || "there";

  // Build daily expenses array for health score
  const dailyExpenses: number[] = [];
  const dayMap: Record<number, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const day = t.date.getDate();
      dayMap[day] = (dayMap[day] || 0) + t.amount;
    });
  for (let i = 1; i <= new Date().getDate(); i++) {
    dailyExpenses.push(dayMap[i] || 0);
  }

  const health = useFinancialHealth({
    income,
    expenses,
    budgets,
    goals: activeGoals,
    dailyExpenses,
  });

  const recentTx = transactions.slice(0, 6);

  const greeting = new Date().getHours() < 12 ? "Good morning" :
    new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting}, {userName}</h1>
            <p className="text-muted-foreground text-sm">Here's your financial overview for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/transactions")}>
              <Plus className="h-4 w-4 mr-1" /> Add Transaction
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => navigate("/chat")}>
              <MessageSquare className="h-4 w-4 mr-1" /> Ask AI
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthScore grade={health.grade} score={health.total} />
          <StatCard title="Total Balance" value={fmt(totalBalance)} change={`${savingsRate}% saved`} positive={savingsRate > 0} icon={DollarSign} />
          <StatCard title="Income" value={fmt(income)} change={fmt(income)} positive icon={TrendingUp} />
          <StatCard title="Expenses" value={fmt(expenses)} change={`${Math.round((expenses / Math.max(income, 1)) * 100)}% of income`} positive={false} icon={TrendingDown} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Budget Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Budget Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgets.slice(0, 5).map((b) => {
                const cat = getCategory(b.category);
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {cat && <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                        <span className="text-sm">{cat?.label}</span>
                      </div>
                      <span className={`text-xs font-mono ${b.isOver ? "text-destructive" : "text-muted-foreground"}`}>
                        {fmt(b.spent)} / {fmt(b.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${b.isOver ? "bg-destructive" : b.isWarning ? "bg-warning" : "bg-primary"}`}
                      />
                    </div>
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No budgets set. Go to Goals & Budgets to create one.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")} className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTx.map((tx) => {
                  const cat = getCategory(tx.category);
                  const isExpense = tx.type === "expense" || tx.type === "withdrawal";
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat?.color}15` }}>
                          {cat && <cat.icon className="h-4 w-4" style={{ color: cat.color }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${isExpense ? "text-destructive" : "text-success"}`}>
                        {isExpense ? "-" : "+"}{fmt(tx.amount)}
                      </span>
                    </motion.div>
                  );
                })}
                {recentTx.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions yet. Add your first one!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Savings Goals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/goals")} className="text-primary">
              Manage Goals
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeGoals.map((g) => {
                const cat = getCategory(g.category);
                return (
                  <div key={g.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {cat && <cat.icon className="h-4 w-4" style={{ color: cat.color }} />}
                      <span className="text-sm font-medium">{g.title}</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-lg font-bold font-mono">{fmt(g.currentAmount)}</span>
                      <span className="text-xs text-muted-foreground">/ {fmt(g.targetAmount)}</span>
                    </div>
                    <Progress value={g.percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-2">{g.daysLeft} days left</p>
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No active goals. Create one to start saving!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
