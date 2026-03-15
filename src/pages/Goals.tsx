import { motion } from "framer-motion";
import { Plus, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_GOALS, MOCK_BUDGETS, CATEGORIES } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

export default function Goals() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Goals & Budgets</h1>
            <p className="text-sm text-muted-foreground">Track your targets and control spending per category</p>
          </div>
          <Button size="sm" className="gradient-primary border-0">
            <Plus className="h-4 w-4 mr-1" /> New Goal
          </Button>
        </div>

        {/* Savings Goals */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" /> Savings Goals
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_GOALS.map((g, i) => {
              const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
              const cat = getCategory(g.category);
              const daysLeft = Math.max(0, Math.round((new Date(g.deadline).getTime() - Date.now()) / 86400000));
              const monthlyNeeded = Math.round((g.targetAmount - g.currentAmount) / Math.max(1, daysLeft / 30));
              const onTrack = pct >= 50;

              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${cat?.color || "hsl(var(--primary))"} ${pct}%, transparent ${pct}%)` }} />
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {cat && <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                            <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                          </div>}
                          <div>
                            <h3 className="font-semibold">{g.title}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{daysLeft} days left</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {onTrack ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className={`text-xs font-medium ${onTrack ? "text-success" : "text-warning"}`}>
                            {onTrack ? "On track" : "Behind"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-bold font-mono">${g.currentAmount.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground font-mono">/ ${g.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-2 mb-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pct}% complete</span>
                        <span>Need ${monthlyNeeded}/month</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Monthly Budgets */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" /> Monthly Budgets
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MOCK_BUDGETS.map((b, i) => {
              const cat = getCategory(b.category);
              const pct = Math.round((b.spent / b.limit) * 100);
              const remaining = b.limit - b.spent;
              const over = remaining <= 0;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={over ? "border-destructive/30" : ""}>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-2 mb-3">
                        {cat && <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                          <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                        </div>}
                        <div>
                          <p className="text-sm font-medium">{cat?.label}</p>
                          <p className="text-xs text-muted-foreground">{b.period}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mb-2">
                        <span className="text-lg font-bold font-mono">${b.spent}</span>
                        <span className="text-xs text-muted-foreground font-mono">/ ${b.limit}</span>
                      </div>

                      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${over ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary"}`}
                        />
                      </div>

                      <p className={`text-xs font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>
                        {over ? "Budget exceeded!" : `$${remaining.toFixed(0)} remaining`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-dashed flex items-center justify-center min-h-[160px] cursor-pointer hover:border-primary/40 transition-colors">
                <div className="text-center">
                  <Plus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Add Budget</span>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
