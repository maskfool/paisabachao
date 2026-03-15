import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowRight, ArrowLeft, Check, User, PiggyBank, Bot,
  Landmark, Banknote, CreditCard, Plus, Trash2, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES } from "@/lib/constants";
import { useSettings } from "@/hooks/useSettings";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { encrypt } from "@/lib/crypto";

const STEPS = ["Welcome", "Profile", "Accounts", "Budgets", "AI Setup", "Done"];

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank Account", icon: Landmark },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "wallet", label: "Digital Wallet", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
] as const;

const BUDGET_CATEGORIES = CATEGORIES.filter((c) =>
  ["groceries", "dining", "entertainment", "shopping", "transport", "subscriptions", "utilities", "healthcare", "fuel", "rent"].includes(c.id)
);

interface NewAccount {
  name: string;
  type: string;
  balance: string;
}

interface NewBudget {
  category: string;
  limit: string;
}

export default function Onboarding() {
  const { setSetting } = useSettings();
  const [step, setStep] = useState(0);

  // Profile
  const [name, setName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [isFreelancer, setIsFreelancer] = useState(false);

  // Accounts
  const [accounts, setAccounts] = useState<NewAccount[]>([
    { name: "Main Bank", type: "bank", balance: "" },
    { name: "Cash", type: "cash", balance: "" },
  ]);

  // Budgets
  const [selectedBudgets, setSelectedBudgets] = useState<NewBudget[]>([
    { category: "groceries", limit: "8000" },
    { category: "dining", limit: "5000" },
    { category: "entertainment", limit: "3000" },
    { category: "shopping", limit: "5000" },
    { category: "utilities", limit: "5000" },
  ]);

  // AI
  const [apiKey, setApiKey] = useState("");
  const [skipAI, setSkipAI] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const addAccount = () => {
    setAccounts([...accounts, { name: "", type: "bank", balance: "" }]);
  };

  const removeAccount = (idx: number) => {
    setAccounts(accounts.filter((_, i) => i !== idx));
  };

  const updateAccount = (idx: number, field: keyof NewAccount, value: string) => {
    const updated = [...accounts];
    updated[idx] = { ...updated[idx], [field]: value };
    setAccounts(updated);
  };

  const toggleBudgetCategory = (categoryId: string) => {
    const exists = selectedBudgets.find((b) => b.category === categoryId);
    if (exists) {
      setSelectedBudgets(selectedBudgets.filter((b) => b.category !== categoryId));
    } else {
      setSelectedBudgets([...selectedBudgets, { category: categoryId, limit: "5000" }]);
    }
  };

  const updateBudgetLimit = (category: string, limit: string) => {
    setSelectedBudgets(selectedBudgets.map((b) => b.category === category ? { ...b, limit } : b));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && monthlyIncome.trim().length > 0;
      case 2: return accounts.some((a) => a.name.trim() && a.balance.trim());
      case 3: return selectedBudgets.length > 0;
      case 4: return skipAI || apiKey.trim().length > 0;
      default: return true;
    }
  };

  const handleFinish = async () => {
    try {
      // Save profile
      await setSetting("name", name);
      await setSetting("monthlyIncome", monthlyIncome);
      await setSetting("incomeType", isFreelancer ? "variable" : "fixed");

      // Save accounts
      const now = new Date();
      const validAccounts = accounts.filter((a) => a.name.trim() && a.balance.trim());
      if (validAccounts.length > 0) {
        await db.accounts.clear();
        await db.accounts.bulkAdd(
          validAccounts.map((a) => ({
            name: a.name,
            type: a.type as "bank" | "cash" | "wallet" | "credit_card",
            balance: parseFloat(a.balance) || 0,
            currency: "INR",
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      // Save budgets
      if (selectedBudgets.length > 0) {
        await db.budgets.clear();
        await db.budgets.bulkAdd(
          selectedBudgets.map((b) => ({
            category: b.category,
            limit: parseFloat(b.limit) || 5000,
            spent: 0,
            currency: "INR",
            period: "monthly" as const,
            alertThreshold: 80,
            createdAt: now,
          }))
        );
      }

      // Save AI key (encrypted)
      if (apiKey.trim()) {
        const encryptedKey = await encrypt(apiKey);
        await setSetting("apiKey", encryptedKey);
      }

      // Mark onboarding complete
      await setSetting("onboardingComplete", "true");

      toast.success("You're all set! Welcome to PaisaBachao!");
      setStep(5);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (step === 4) {
      handleFinish();
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length - 1}</span>
              <span className="text-xs text-muted-foreground">{STEPS[step]}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                  <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                    <Wallet className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Welcome to PaisaBachao</h1>
                    <p className="text-muted-foreground mt-2">Your AI-powered personal finance companion.<br />Let's get you set up in under 2 minutes.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg border p-3">
                      <PiggyBank className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Track Spending</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <Bot className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">AI Advisor</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <Sparkles className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">100% Private</p>
                    </div>
                  </div>
                  <Button onClick={goNext} className="w-full gradient-primary border-0" size="lg">
                    Get Started <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">About You</h2>
                    <p className="text-sm text-muted-foreground">Help us personalize your experience</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Your Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>Monthly Income (₹)</Label>
                      <Input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        placeholder="e.g. 50000"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Used by AI for budgeting advice. You can change this later.</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Variable Income</p>
                        <p className="text-xs text-muted-foreground">I'm a freelancer / my income varies monthly</p>
                      </div>
                      <Switch checked={isFreelancer} onCheckedChange={setIsFreelancer} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Accounts */}
            {step === 2 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Landmark className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Your Accounts</h2>
                    <p className="text-sm text-muted-foreground">Add your bank accounts, cash, or wallets</p>
                  </div>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto">
                    {accounts.map((acc, idx) => (
                      <div key={idx} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Account {idx + 1}</span>
                          {accounts.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAccount(idx)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={acc.name}
                            onChange={(e) => updateAccount(idx, "name", e.target.value)}
                            placeholder="Account name"
                            className="text-sm"
                          />
                          <Select value={acc.type} onValueChange={(v) => updateAccount(idx, "type", v)}>
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ACCOUNT_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  <span className="flex items-center gap-2">
                                    <t.icon className="h-3 w-3" /> {t.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          type="number"
                          value={acc.balance}
                          onChange={(e) => updateAccount(idx, "balance", e.target.value)}
                          placeholder="Current balance (₹)"
                          className="font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={addAccount}>
                    <Plus className="h-4 w-4 mr-2" /> Add Another Account
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Budgets */}
            {step === 3 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <PiggyBank className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Monthly Budgets</h2>
                    <p className="text-sm text-muted-foreground">Select categories and set monthly limits (₹)</p>
                  </div>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto">
                    {BUDGET_CATEGORIES.map((cat) => {
                      const selected = selectedBudgets.find((b) => b.category === cat.id);
                      return (
                        <div key={cat.id} className={`rounded-lg border p-3 transition-colors ${selected ? "border-primary bg-primary/5" : ""}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={!!selected}
                              onCheckedChange={() => toggleBudgetCategory(cat.id)}
                            />
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                              <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                            </div>
                            <span className="text-sm font-medium flex-1">{cat.label}</span>
                            {selected && (
                              <Input
                                type="number"
                                value={selected.limit}
                                onChange={(e) => updateBudgetLimit(cat.id, e.target.value)}
                                className="w-24 h-8 text-sm font-mono text-right"
                                placeholder="5000"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: AI Setup */}
            {step === 4 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">AI Financial Advisor</h2>
                    <p className="text-sm text-muted-foreground">PaisaBachao uses Claude AI to give you personalized financial advice</p>
                  </div>
                  <div className="space-y-4">
                    <div className={skipAI ? "opacity-50 pointer-events-none" : ""}>
                      <Label>Claude API Key</Label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        disabled={skipAI}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your key from{" "}
                        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          console.anthropic.com
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={skipAI}
                        onCheckedChange={(v) => setSkipAI(!!v)}
                      />
                      <Label className="text-sm text-muted-foreground cursor-pointer">Skip for now — I'll add it later in Settings</Label>
                    </div>
                    <div className="rounded-lg bg-muted/50 border p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Privacy:</strong> Your API key is stored only in your browser's local database. It's never sent to any server except Anthropic's API directly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Done */}
            {step === 5 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto"
                  >
                    <Check className="h-10 w-10 text-success" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold">You're All Set!</h2>
                    <p className="text-muted-foreground mt-2">
                      Welcome aboard, {name || "friend"}! Your finances are now in good hands.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{accounts.filter((a) => a.name.trim()).length}</p>
                      <p className="text-xs text-muted-foreground">Accounts added</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{selectedBudgets.length}</p>
                      <p className="text-xs text-muted-foreground">Budgets set</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    className="w-full gradient-primary border-0"
                    size="lg"
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && step < 5 && (
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={goNext} disabled={!canProceed()} className="gradient-primary border-0">
              {step === 4 ? "Finish Setup" : "Continue"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
