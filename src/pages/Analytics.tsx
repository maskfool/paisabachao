import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, ResponsiveContainer } from "recharts";
import { MOCK_TRANSACTIONS, CATEGORIES } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

// Compute category spending
const categorySpending = MOCK_TRANSACTIONS
  .filter((t) => t.type === "expense")
  .reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

const pieData = Object.entries(categorySpending)
  .map(([id, amount]) => ({ name: getCategory(id)?.label || id, value: amount, fill: getCategory(id)?.color || "#888" }))
  .sort((a, b) => b.value - a.value);

const monthlyData = [
  { month: "Oct", income: 4800, expenses: 3200 },
  { month: "Nov", income: 5000, expenses: 3600 },
  { month: "Dec", income: 5500, expenses: 4200 },
  { month: "Jan", income: 5200, expenses: 3100 },
  { month: "Feb", income: 5200, expenses: 2900 },
  { month: "Mar", income: 5200, expenses: 1843 },
];

const weeklyData = [
  { week: "W1", amount: 1245 },
  { week: "W2", amount: 368 },
  { week: "W3", amount: 0 },
  { week: "W4", amount: 0 },
];

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-5))" },
  amount: { label: "Spending", color: "hsl(var(--chart-2))" },
};

export default function Analytics() {
  const totalExpenses = MOCK_TRANSACTIONS.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = MOCK_TRANSACTIONS.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Deep insights into your spending patterns</p>
          </div>
          <Select defaultValue="march">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="march">March 2026</SelectItem>
              <SelectItem value="february">February 2026</SelectItem>
              <SelectItem value="january">January 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Income", value: `$${totalIncome.toLocaleString()}`, color: "text-success" },
            { label: "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, color: "text-destructive" },
            { label: "Net Savings", value: `$${(totalIncome - totalExpenses).toLocaleString()}`, color: "text-primary" },
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
          {/* Income vs Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Income vs Expenses (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px]">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} strokeWidth={2}>
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} stroke="hsl(var(--card))" />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-mono font-medium">${d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Spending */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🤖 AI Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-success/10 p-3 border border-success/20">
                <p className="font-medium text-success">✅ Strengths</p>
                <p className="text-muted-foreground mt-1">Excellent savings rate at {savingsRate}%. Investment contributions are consistent. Utility spending is well controlled.</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3 border border-warning/20">
                <p className="font-medium text-warning">⚠️ Watch Out</p>
                <p className="text-muted-foreground mt-1">Dining out spending hit 88% of budget by week 2. Shopping budget is maxed. Consider meal prepping to save $100+/month.</p>
              </div>
              <div className="rounded-lg bg-info/10 p-3 border border-info/20">
                <p className="font-medium text-info">💡 Recommendation</p>
                <p className="text-muted-foreground mt-1">Redirect $200 from shopping to your Japan vacation fund. At current pace you'll miss the September deadline by $1,400.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
