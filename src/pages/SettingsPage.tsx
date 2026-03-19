import { useState, useEffect } from "react";
import { Download, Upload, User, DollarSign, Bell, Trash2, Bot, AlertCircle, Save, RotateCcw, Check, Briefcase, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CURRENCIES } from "@/lib/constants";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useMonthlyIncome } from "@/hooks/useMonthlyIncome";
import { db } from "@/lib/db";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { encrypt, decrypt } from "@/lib/crypto";
import { format } from "date-fns";

export default function SettingsPage() {
  const { settings, setSetting } = useSettings();
  const { currencyCode, conversionRate, setCurrency, setConversionRate } = useCurrency();
  const { currentIncome, allIncomes, setIncome, currentMonthKey } = useMonthlyIncome();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Local state for form fields
  const [name, setName] = useState("");
  const [defaultIncome, setDefaultIncome] = useState("");
  const [thisMonthIncome, setThisMonthIncome] = useState("");
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [strictness, setStrictness] = useState("strict");
  const [aiModel, setAiModel] = useState("claude-sonnet-4-20250514");
  const [localConversionRate, setLocalConversionRate] = useState("1");
  const [localCurrency, setLocalCurrency] = useState("INR");

  // Track dirty state
  const [profileDirty, setProfileDirty] = useState(false);
  const [aiDirty, setAiDirty] = useState(false);
  const [currencyDirty, setCurrencyDirty] = useState(false);
  const [incomeDirty, setIncomeDirty] = useState(false);

  // Sync local state from persisted settings
  useEffect(() => {
    setName(settings.name || "");
    setDefaultIncome(settings.monthlyIncome || "");
    setIsFreelancer(settings.incomeType === "variable");
    if (settings.apiKey) {
      decrypt(settings.apiKey).then((k) => setClaudeKey(k)).catch(() => setClaudeKey(settings.apiKey));
    } else {
      setClaudeKey("");
    }
    if (settings.openaiApiKey) {
      decrypt(settings.openaiApiKey).then((k) => setOpenaiKey(k)).catch(() => setOpenaiKey(settings.openaiApiKey));
    } else {
      setOpenaiKey("");
    }
    setStrictness(settings.aiStrictness || "strict");
    setAiModel(settings.aiModel || "claude-sonnet-4-20250514");
    setLocalConversionRate(String(conversionRate));
    setLocalCurrency(currencyCode);
  }, [settings.name, settings.monthlyIncome, settings.incomeType, settings.apiKey, settings.openaiApiKey, settings.aiStrictness, settings.aiModel, conversionRate, currencyCode]);

  // Sync this month's income
  useEffect(() => {
    setThisMonthIncome(currentIncome ? String(currentIncome.amount) : "");
  }, [currentIncome]);

  const saveProfile = async () => {
    await setSetting("name", name);
    await setSetting("monthlyIncome", defaultIncome);
    await setSetting("incomeType", isFreelancer ? "variable" : "fixed");
    setProfileDirty(false);
    toast.success("Profile saved!");
  };

  const saveMonthlyIncome = async () => {
    const amount = parseFloat(thisMonthIncome);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid income amount.");
      return;
    }
    await setIncome(amount);
    setIncomeDirty(false);
    toast.success(`Income for ${format(new Date(), "MMMM yyyy")} saved!`);
  };

  const saveAI = async () => {
    if (claudeKey.trim()) {
      const encryptedClaude = await encrypt(claudeKey);
      await setSetting("apiKey", encryptedClaude);
    }
    if (openaiKey.trim()) {
      const encryptedOpenai = await encrypt(openaiKey);
      await setSetting("openaiApiKey", encryptedOpenai);
    }
    await setSetting("aiStrictness", strictness);
    await setSetting("aiModel", aiModel);
    setAiDirty(false);
    toast.success("AI settings saved!");
  };

  const saveCurrency = async () => {
    await setCurrency(localCurrency);
    if (localCurrency !== "INR") {
      await setConversionRate(localConversionRate);
    }
    setCurrencyDirty(false);
    toast.success("Currency settings saved!");
  };

  const handleExport = async () => {
    const data = {
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      goals: await db.goals.toArray(),
      budgets: await db.budgets.toArray(),
      settings: await db.settings.toArray(),
      monthlyIncomes: await db.monthlyIncomes.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paisabachao-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const parseDates = <T extends Record<string, unknown>>(items: T[], dateFields: string[]): T[] =>
          items.map((item) => {
            const parsed = { ...item };
            dateFields.forEach((f) => {
              if (parsed[f]) (parsed as Record<string, unknown>)[f] = new Date(parsed[f] as string);
            });
            return parsed;
          });
        if (data.accounts) { await db.accounts.clear(); await db.accounts.bulkAdd(parseDates(data.accounts, ["createdAt", "updatedAt"])); }
        if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(parseDates(data.transactions, ["date", "createdAt"])); }
        if (data.goals) { await db.goals.clear(); await db.goals.bulkAdd(parseDates(data.goals, ["deadline", "createdAt", "updatedAt"])); }
        if (data.budgets) { await db.budgets.clear(); await db.budgets.bulkAdd(parseDates(data.budgets, ["createdAt"])); }
        if (data.settings) { await db.settings.clear(); await db.settings.bulkAdd(parseDates(data.settings, ["updatedAt"])); }
        if (data.monthlyIncomes) { await db.monthlyIncomes.clear(); await db.monthlyIncomes.bulkAdd(parseDates(data.monthlyIncomes, ["createdAt"])); }
        toast.success("Data imported successfully!");
      } catch {
        toast.error("Failed to import data. Check the file format.");
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    await db.transactions.clear();
    await db.goals.clear();
    await db.budgets.clear();
    await db.accounts.clear();
    await db.chatMessages.clear();
    await db.monthlyIncomes.clear();
    setClearConfirm(false);
    toast.success("All data cleared.");
  };

  const handleStartFresh = async () => {
    await db.transactions.clear();
    await db.goals.clear();
    await db.budgets.clear();
    await db.accounts.clear();
    await db.chatMessages.clear();
    await db.settings.clear();
    await db.monthlyIncomes.clear();
    await setSetting("onboardingComplete", "false");
    setResetConfirm(false);
    toast.success("Reset complete! Redirecting to setup...");
    setTimeout(() => window.location.href = "/onboarding", 500);
  };

  const selectedCurrencyInfo = CURRENCIES.find((c) => c.code === localCurrency);
  const isLocalBaseCurrency = localCurrency === "INR";
  const currentMonthLabel = format(new Date(), "MMMM yyyy");

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences and account</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setProfileDirty(true); }}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label className="text-xs">Default Monthly Income (₹)</Label>
              <Input
                type="number"
                value={defaultIncome}
                onChange={(e) => { setDefaultIncome(e.target.value); setProfileDirty(true); }}
                placeholder="50000"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Your base monthly income. Used by AI for budgeting advice.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Variable Income (Freelancer)</p>
                <p className="text-xs text-muted-foreground">Enable to log income per month</p>
              </div>
              <Switch
                checked={isFreelancer}
                onCheckedChange={(v) => { setIsFreelancer(v); setProfileDirty(true); }}
              />
            </div>
            <Button onClick={saveProfile} disabled={!profileDirty} className="w-full gradient-primary border-0">
              {profileDirty ? <><Save className="h-4 w-4 mr-2" /> Save Profile</> : <><Check className="h-4 w-4 mr-2" /> Saved</>}
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Income (shown when freelancer mode enabled) */}
        {isFreelancer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Monthly Income Log</CardTitle>
              <CardDescription>Record your actual income each month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{currentMonthLabel}</span>
                </div>
                <div>
                  <Label className="text-xs">Income this month (₹)</Label>
                  <Input
                    type="number"
                    value={thisMonthIncome}
                    onChange={(e) => { setThisMonthIncome(e.target.value); setIncomeDirty(true); }}
                    placeholder={defaultIncome || "Enter income"}
                    className="font-mono"
                  />
                </div>
                <Button onClick={saveMonthlyIncome} disabled={!incomeDirty} className="w-full mt-3 gradient-primary border-0" size="sm">
                  {incomeDirty ? <><Save className="h-4 w-4 mr-2" /> Save</> : <><Check className="h-4 w-4 mr-2" /> Saved</>}
                </Button>
              </div>

              {/* History */}
              {allIncomes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Income History</p>
                    <div className="space-y-1">
                      {allIncomes.slice(0, 6).map((inc) => (
                        <div key={inc.id} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(inc.month + "-01"), "MMM yyyy")}
                          </span>
                          <span className="font-mono font-medium">₹{inc.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Currency & Conversion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Currency & Display</CardTitle>
            <CardDescription>All data stored in INR. Pick a display currency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Display Currency</Label>
              <Select value={localCurrency} onValueChange={(v) => { setLocalCurrency(v); setCurrencyDirty(true); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isLocalBaseCurrency && (
              <>
                <Separator />
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-warning mb-1">Manual conversion rate required</p>
                    <p>Enter how much 1 INR equals in {localCurrency}.</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">1 INR = ? {localCurrency}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={localConversionRate}
                    onChange={(e) => { setLocalConversionRate(e.target.value); setCurrencyDirty(true); }}
                    placeholder="0.012"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Preview: ₹10,000 = {selectedCurrencyInfo?.symbol}{(10000 * parseFloat(localConversionRate || "0")).toFixed(2)}
                  </p>
                </div>
              </>
            )}

            {isLocalBaseCurrency && (
              <p className="text-xs text-muted-foreground">INR is the base currency. No conversion needed.</p>
            )}

            <Button onClick={saveCurrency} disabled={!currencyDirty} className="w-full gradient-primary border-0">
              {currencyDirty ? <><Save className="h-4 w-4 mr-2" /> Save Currency</> : <><Check className="h-4 w-4 mr-2" /> Saved</>}
            </Button>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> AI Configuration</CardTitle>
            <CardDescription>Configure your AI financial advisor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Claude API Key (Anthropic)</Label>
              <Input
                type="password"
                value={claudeKey}
                onChange={(e) => { setClaudeKey(e.target.value); setAiDirty(true); }}
                placeholder="sk-ant-..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.anthropic.com</a>
              </p>
            </div>
            <div>
              <Label className="text-xs">OpenAI API Key</Label>
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => { setOpenaiKey(e.target.value); setAiDirty(true); }}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 border p-3">
              <p className="text-xs text-muted-foreground">
                Encrypted & stored locally. Add one or both — the app uses whichever key matches your selected model.
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">AI Model</Label>
              <Select value={aiModel} onValueChange={(v) => { setAiModel(v); setAiDirty(true); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4 — Fast & affordable (~₹2/msg)</SelectItem>
                  <SelectItem value="claude-opus-4-20250514">Claude Opus 4 — Best reasoning (~₹10/msg)</SelectItem>
                  <SelectItem value="claude-haiku-4-20250414">Claude Haiku 4 — Fastest (~₹0.50/msg)</SelectItem>
                  <SelectItem disabled={true} value="__divider" className="font-semibold text-muted-foreground pointer-events-none">── OpenAI Models ──</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o — Strong & affordable (~₹1.40/msg)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini — Budget friendly (~₹0.08/msg)</SelectItem>
                  <SelectItem value="o3-mini">O3 Mini — Advanced reasoning (~₹5/msg)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {aiModel.includes("opus") ? "Best for complex financial analysis. Deep reasoning." :
                 aiModel.includes("haiku") ? "Quick responses for simple expense logging." :
                 aiModel === "gpt-4o" ? "Great quality at low cost. Needs OpenAI key." :
                 aiModel === "gpt-4o-mini" ? "Cheapest option. Good for logging, basic advice." :
                 aiModel === "o3-mini" ? "Strong reasoning model. Needs OpenAI key." :
                 aiModel.includes("sonnet") ? "Recommended. Great balance of quality and cost." :
                 "Select a model based on your needs."}
                {(aiModel.startsWith("gpt-") || aiModel.startsWith("o3")) && !openaiKey && (
                  <span className="text-warning font-medium"> Requires OpenAI API key above.</span>
                )}
                {aiModel.startsWith("claude") && !claudeKey && (
                  <span className="text-warning font-medium"> Requires Claude API key above.</span>
                )}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">AI Strictness</Label>
              <Select value={strictness} onValueChange={(v) => { setStrictness(v); setAiDirty(true); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict — No nonsense</SelectItem>
                  <SelectItem value="moderate">Moderate — Balanced advice</SelectItem>
                  <SelectItem value="lenient">Lenient — Gentle suggestions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveAI} disabled={!aiDirty} className="w-full gradient-primary border-0">
              {aiDirty ? <><Save className="h-4 w-4 mr-2" /> Save AI Settings</> : <><Check className="h-4 w-4 mr-2" /> Saved</>}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Budget Alerts</p>
                <p className="text-xs text-muted-foreground">Notify when spending exceeds threshold</p>
              </div>
              <Switch checked={settings.budgetAlerts !== "false"} onCheckedChange={(v) => setSetting("budgetAlerts", String(v))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Goal Reminders</p>
                <p className="text-xs text-muted-foreground">Weekly progress updates</p>
              </div>
              <Switch checked={settings.goalReminders !== "false"} onCheckedChange={(v) => setSetting("goalReminders", String(v))} />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Data Management</CardTitle>
            <CardDescription>Your data lives on your device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export All Data (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" /> Import Data from Backup
            </Button>
            <Separator />
            <Dialog open={resetConfirm} onOpenChange={setResetConfirm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <RotateCcw className="h-4 w-4 mr-2" /> Start Fresh (New User)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Start fresh?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This will delete ALL data (transactions, goals, budgets, accounts, chat history, income log, settings) and restart the onboarding wizard. This cannot be undone.</p>
                <div className="flex gap-2 justify-end mt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button variant="destructive" onClick={handleStartFresh}>Reset Everything</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Delete all data?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This will delete all transactions, goals, budgets, accounts, and income log. Settings are kept. This cannot be undone.</p>
                <div className="flex gap-2 justify-end mt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button variant="destructive" onClick={handleClearAll}>Delete Everything</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">PaisaBachao v1.0 — Your data never leaves your device</p>
        </div>
      </div>
    </AppLayout>
  );
}
