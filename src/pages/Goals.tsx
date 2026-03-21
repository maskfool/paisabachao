import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle, Trash2, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/constants";
import { useGoals } from "@/hooks/useGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { useCurrency } from "@/hooks/useCurrency";
import { validateAmount, validateRequired, validateFutureDate } from "@/lib/validation";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import type { Goal, Budget } from "@/types";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

function AddGoalDialog({ onAdd }: { onAdd: (data: Omit<Goal, "id" | "createdAt" | "updatedAt">) => Promise<unknown> }) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [category, setCategory] = useState("savings");
  const [priority, setPriority] = useState<Goal["priority"]>("medium");
  const [deadline, setDeadline] = useState("");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const titleErr = validateRequired(title, "Title");
    if (titleErr) errs.title = titleErr;
    const amtErr = validateAmount(targetAmount);
    if (amtErr) errs.targetAmount = amtErr;
    const dateErr = validateFutureDate(deadline);
    if (dateErr) errs.deadline = dateErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onAdd({
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      currency: "INR",
      deadline: new Date(deadline),
      category,
      priority,
      status: "active",
    });
    setTitle(""); setTargetAmount(""); setDeadline("");
    setOpen(false);
    toast.success("Goal created!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs">Goal Title</Label>
            <Input placeholder="Emergency Fund, Vacation..." value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }} />
            {errors.title && <p className="text-xs text-destructive mt-0.5">{errors.title}</p>}
          </div>
          <div>
            <Label className="text-xs">Target Amount (₹)</Label>
            <Input type="number" placeholder="100000" className="font-mono" value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); setErrors((p) => ({ ...p, targetAmount: "" })); }} />
            {errors.targetAmount && <p className="text-xs text-destructive mt-0.5">{errors.targetAmount}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Goal["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }} />
            {errors.deadline && <p className="text-xs text-destructive mt-0.5">{errors.deadline}</p>}
          </div>
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContributeDialog({ goal, onContribute }: { goal: Goal & { percentage: number }; onContribute: (goalId: number, amount: number) => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { format: fmt } = useCurrency();

  const remaining = goal.targetAmount - goal.currentAmount;

  const handleSubmit = async () => {
    const err = validateAmount(amount);
    if (err) { setError(err); return; }
    const num = parseFloat(amount);
    if (num > remaining) { setError(`Maximum contribution is ₹${remaining.toLocaleString("en-IN")}`); return; }
    await onContribute(goal.id!, num);
    setAmount("");
    setOpen(false);
    toast.success(`₹${num.toLocaleString("en-IN")} added to ${goal.title}!`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <ArrowUpCircle className="h-3 w-3 mr-1" /> Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Contribute to {goal.title}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{fmt(goal.currentAmount)}</p>
            <p className="text-xs text-muted-foreground">of {fmt(goal.targetAmount)} ({goal.percentage}%)</p>
          </div>
          <div>
            <Label className="text-xs">Amount to add (₹)</Label>
            <Input
              type="number"
              placeholder={String(Math.min(5000, remaining))}
              className="font-mono"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
            <p className="text-xs text-muted-foreground mt-1">Remaining: {fmt(remaining)}</p>
          </div>
          <div className="flex gap-2">
            {[1000, 5000, 10000].filter((v) => v <= remaining).map((v) => (
              <Button key={v} variant="outline" size="sm" className="flex-1 text-xs font-mono" onClick={() => setAmount(String(v))}>
                ₹{v.toLocaleString("en-IN")}
              </Button>
            ))}
          </div>
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Add Funds
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddBudgetDialog({ onAdd }: { onAdd: (data: Omit<Budget, "id" | "createdAt" | "spent">) => Promise<unknown> }) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const catErr = validateRequired(category, "Category");
    if (catErr) errs.category = catErr;
    const amtErr = validateAmount(limit);
    if (amtErr) errs.limit = amtErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onAdd({
      category,
      limit: parseFloat(limit),
      currency: "INR",
      period: "monthly",
      alertThreshold: 80,
    });
    setCategory(""); setLimit("");
    setOpen(false);
    toast.success("Budget added!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="border-dashed flex items-center justify-center min-h-[160px] cursor-pointer hover:border-primary/40 transition-colors">
          <div className="text-center">
            <Plus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">Add Budget</span>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Budget</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((p) => ({ ...p, category: "" })); }}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive mt-0.5">{errors.category}</p>}
          </div>
          <div>
            <Label className="text-xs">Monthly Limit (₹)</Label>
            <Input type="number" placeholder="5000" className="font-mono" value={limit} onChange={(e) => { setLimit(e.target.value); setErrors((p) => ({ ...p, limit: "" })); }} />
            {errors.limit && <p className="text-xs text-destructive mt-0.5">{errors.limit}</p>}
          </div>
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Save Budget
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Goals() {
  const { activeGoals, addGoal, deleteGoal, contributeToGoal } = useGoals();
  const { budgets, addBudget, deleteBudget } = useBudgets();
  const { format: fmt } = useCurrency();

  // Budget alerts
  const overBudgets = budgets.filter((b) => b.isOver);
  const warningBudgets = budgets.filter((b) => b.isWarning && !b.isOver);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Goals & Budgets</h1>
            <p className="text-sm text-muted-foreground">Track your targets and control spending per category</p>
          </div>
          <AddGoalDialog onAdd={addGoal} />
        </div>

        {/* Budget Alerts */}
        {(overBudgets.length > 0 || warningBudgets.length > 0) && (
          <div className="space-y-2">
            {overBudgets.map((b) => {
              const cat = getCategory(b.category);
              return (
                <div key={b.id} className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm">
                    <span className="font-medium text-destructive">{cat?.label}</span> budget exceeded — {fmt(b.spent)} spent of {fmt(b.limit)} limit
                  </p>
                </div>
              );
            })}
            {warningBudgets.map((b) => {
              const cat = getCategory(b.category);
              return (
                <div key={b.id} className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-sm">
                    <span className="font-medium text-warning">{cat?.label}</span> approaching limit — {b.percentage}% used ({fmt(b.remaining)} remaining)
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Savings Goals */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" /> Savings Goals
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeGoals.map((g, i) => {
              const cat = getCategory(g.category);
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden group">
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${cat?.color || "hsl(var(--primary))"} ${g.percentage}%, transparent ${g.percentage}%)` }} />
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
                              <span className="text-xs text-muted-foreground">{g.daysLeft} days left</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {g.isOnTrack ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            <span className={`text-xs font-medium ${g.isOnTrack ? "text-success" : "text-warning"}`}>
                              {g.isOnTrack ? "On track" : "Behind"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => g.id && deleteGoal(g.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-bold font-mono">{fmt(g.currentAmount)}</span>
                        <span className="text-sm text-muted-foreground font-mono">/ {fmt(g.targetAmount)}</span>
                      </div>
                      <Progress value={g.percentage} className="h-2 mb-3" />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          <span>{g.percentage}% complete</span>
                          <span className="mx-2">·</span>
                          <span>Need {fmt(g.monthlyNeeded)}/month</span>
                        </div>
                        <ContributeDialog goal={g} onContribute={contributeToGoal} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {activeGoals.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No active goals</p>
                <p className="text-xs text-muted-foreground mt-1">Create a savings goal to start tracking your progress</p>
              </div>
            )}
          </div>
        </section>

        {/* Monthly Budgets */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" /> Monthly Budgets
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {budgets.map((b, i) => {
              const cat = getCategory(b.category);
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`group ${b.isOver ? "border-destructive/30" : ""}`}>
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {cat && <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                            <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                          </div>}
                          <div>
                            <p className="text-sm font-medium">{cat?.label}</p>
                            <p className="text-xs text-muted-foreground">{b.period}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => b.id && deleteBudget(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-end mb-2">
                        <span className="text-lg font-bold font-mono">{fmt(b.spent)}</span>
                        <span className="text-xs text-muted-foreground font-mono">/ {fmt(b.limit)}</span>
                      </div>

                      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${b.isOver ? "bg-destructive" : b.isWarning ? "bg-warning" : "bg-primary"}`}
                        />
                      </div>

                      <p className={`text-xs font-medium ${b.isOver ? "text-destructive" : "text-muted-foreground"}`}>
                        {b.isOver ? "Budget exceeded!" : `${fmt(b.remaining)} remaining`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            <AddBudgetDialog onAdd={addBudget} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
