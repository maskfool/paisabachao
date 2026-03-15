import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Plus, MessageSquare,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_TRANSACTIONS, MOCK_BUDGETS, MOCK_GOALS, CATEGORIES } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

function HealthScore() {
  const score = 72;
  const grade = "B+";
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
        <p className="text-xs text-muted-foreground mt-2">Good shape! Reduce dining spending to reach A.</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, change, positive, icon: Icon }: { title: string; value: string; change: string; positive: boolean; icon: any }) {
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
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const totalIncome = MOCK_TRANSACTIONS.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = MOCK_TRANSACTIONS.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const recentTx = MOCK_TRANSACTIONS.slice(0, 6);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Good evening, Alex 👋</h1>
            <p className="text-muted-foreground text-sm">Here's your financial overview for March 2026</p>
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
          <HealthScore />
          <StatCard title="Total Balance" value={`$${balance.toLocaleString()}`} change="12.5%" positive icon={DollarSign} />
          <StatCard title="Income" value={`$${totalIncome.toLocaleString()}`} change="3.2%" positive icon={TrendingUp} />
          <StatCard title="Expenses" value={`$${totalExpenses.toLocaleString()}`} change="8.1%" positive={false} icon={TrendingDown} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Budget Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Budget Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_BUDGETS.slice(0, 5).map((b) => {
                const cat = getCategory(b.category);
                const pct = Math.round((b.spent / b.limit) * 100);
                const over = pct >= 100;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {cat && <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                        <span className="text-sm">{cat?.label}</span>
                      </div>
                      <span className={`text-xs font-mono ${over ? "text-destructive" : "text-muted-foreground"}`}>
                        ${b.spent} / ${b.limit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${over ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary"}`}
                      />
                    </div>
                  </div>
                );
              })}
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
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${isExpense ? "text-destructive" : "text-success"}`}>
                        {isExpense ? "-" : "+"}${tx.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })}
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
              {MOCK_GOALS.map((g) => {
                const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
                const cat = getCategory(g.category);
                return (
                  <div key={g.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {cat && <cat.icon className="h-4 w-4" style={{ color: cat.color }} />}
                      <span className="text-sm font-medium">{g.title}</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-lg font-bold font-mono">${g.currentAmount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">/ ${g.targetAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-2">Due {g.deadline}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
