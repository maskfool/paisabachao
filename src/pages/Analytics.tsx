import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORIES } from "@/lib/constants";
import { useMonthlyTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useGoals } from "@/hooks/useGoals";
import { useFinancialHealth } from "@/hooks/useFinancialHealth";
import { useCurrency } from "@/hooks/useCurrency";
import { BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

export default function Analytics() {
  const { transactions, income, expenses, investments, savingsRate, categorySpending } = useMonthlyTransactions();
  const { budgets } = useBudgets();
  const { activeGoals } = useGoals();
  const { format: fmt, convert } = useCurrency();

  // Build daily expenses for health score & weekly chart
  const dailyMap: Record<number, number> = {};
  const dailyExpenses: number[] = [];
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const day = t.date.getDate();
      dailyMap[day] = (dailyMap[day] || 0) + t.amount;
    });
  for (let i = 1; i <= new Date().getDate(); i++) {
    dailyExpenses.push(dailyMap[i] || 0);
  }

  const health = useFinancialHealth({ income, expenses, budgets, goals: activeGoals, dailyExpenses });

  // Pie chart data from real spending
  const pieData = Object.entries(categorySpending)
    .map(([id, amount]) => ({
      name: getCategory(id)?.label || id,
      value: Math.round(convert(amount) * 100) / 100,
      fill: getCategory(id)?.color || "#888",
    }))
    .sort((a, b) => b.value - a.value);

  // Weekly spending data
  const weeklyData: { week: string; amount: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const start = w * 7 + 1;
    const end = Math.min((w + 1) * 7, 31);
    let sum = 0;
    for (let d = start; d <= end; d++) {
      sum += dailyMap[d] || 0;
    }
    weeklyData.push({ week: `Week ${w + 1}`, amount: Math.round(convert(sum)) });
  }

  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Deep insights into your spending patterns</p>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold">No data to analyze yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Add some transactions to see spending breakdowns, weekly trends, and your financial health score.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep insights into your spending patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Income", value: fmt(income), color: "text-success" },
            { label: "Total Expenses", value: fmt(expenses), color: "text-destructive" },
            { label: "Net Savings", value: fmt(income - expenses - investments), color: "text-primary" },
            { label: "Savings Rate", value: `${savingsRate}%`, color: savingsRate > 30 ? "text-success" : "text-warning" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category Breakdown Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-[280px] flex items-center">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} strokeWidth={2}>
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} stroke="hsl(var(--card))" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [fmt(value), "Spent"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-mono font-medium">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No spending data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Spending */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [fmt(value), "Spent"]}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Health Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Financial Health Breakdown — Grade: {health.grade} ({health.total}/100)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Savings Rate", score: health.savingsRate, weight: "30%" },
                  { label: "Budget Adherence", score: health.budgetAdherence, weight: "25%" },
                  { label: "Goal Progress", score: health.goalProgress, weight: "25%" },
                  { label: "Emergency Fund", score: health.emergencyFund, weight: "10%" },
                  { label: "Spending Consistency", score: health.spendingConsistency, weight: "10%" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="relative h-16 w-16 mx-auto mb-2">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--secondary))"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={item.score >= 70 ? "hsl(var(--chart-1))" : item.score >= 40 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))"}
                          strokeWidth="3"
                          strokeDasharray={`${item.score}, 100`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.score}</span>
                    </div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.weight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
