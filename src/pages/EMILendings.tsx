import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, Trash2, Pencil, IndianRupee, Users, ArrowUpRight,
  ArrowDownLeft, Check, Clock, AlertTriangle, Car, Home, Smartphone,
  GraduationCap, ShoppingBag, Bike, CircleDollarSign, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEMIs } from "@/hooks/useEMIs";
import { useLendings } from "@/hooks/useLendings";
import { useAccounts } from "@/hooks/useAccounts";
import { useCurrency } from "@/hooks/useCurrency";
import { validateAmount, validateRequired } from "@/lib/validation";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import type { EMI, Lending } from "@/types";

const EMI_TYPES: { value: EMI["type"]; label: string; icon: React.ElementType }[] = [
  { value: "car", label: "Car Loan", icon: Car },
  { value: "home", label: "Home Loan", icon: Home },
  { value: "personal", label: "Personal Loan", icon: CircleDollarSign },
  { value: "electronics", label: "Electronics", icon: Smartphone },
  { value: "consumer", label: "Consumer Loan", icon: ShoppingBag },
  { value: "education", label: "Education Loan", icon: GraduationCap },
  { value: "two_wheeler", label: "Two Wheeler", icon: Bike },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const getEMIIcon = (type: EMI["type"]) => EMI_TYPES.find((t) => t.value === type)?.icon || CreditCard;

// ===== Add EMI Dialog =====

function AddEMIDialog({ onAdd }: { onAdd: (data: Omit<EMI, "id" | "createdAt">) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<EMI["type"]>("personal");
  const [lender, setLender] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [paidCount, setPaidCount] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDay, setDueDay] = useState("5");
  const [creditCardId, setCreditCardId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { accounts } = useAccounts();
  const creditCardAccounts = accounts.filter((a) => a.type === "credit_card");

  const reset = () => {
    setName(""); setType("personal"); setLender(""); setTotalAmount("");
    setEmiAmount(""); setInterestRate(""); setTenureMonths("");
    setPaidCount("0"); setStartDate(new Date().toISOString().split("T")[0]);
    setDueDay("5"); setCreditCardId(""); setErrors({});
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(name, "Name");
    if (nameErr) errs.name = nameErr;
    const totalErr = validateAmount(totalAmount);
    if (totalErr) errs.totalAmount = totalErr;
    const emiErr = validateAmount(emiAmount);
    if (emiErr) errs.emiAmount = emiErr;
    const tenureErr = validateRequired(tenureMonths, "Tenure");
    if (tenureErr) errs.tenureMonths = tenureErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await onAdd({
      name,
      type,
      lender: lender || "Unknown",
      totalAmount: parseFloat(totalAmount),
      emiAmount: parseFloat(emiAmount),
      interestRate: parseFloat(interestRate) || 0,
      tenureMonths: parseInt(tenureMonths),
      paidCount: parseInt(paidCount) || 0,
      startDate: new Date(startDate),
      dueDay: parseInt(dueDay) || 5,
      currency: "INR",
      status: "active",
      creditCardAccountId: creditCardId && creditCardId !== "none" ? Number(creditCardId) : undefined,
    });
    reset();
    setOpen(false);
    toast.success("EMI added!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-1" /> Add EMI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add EMI</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs">EMI Name</Label>
            <Input placeholder="e.g. Car Loan - HDFC" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EMI["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMI_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Lender / Bank</Label>
              <Input placeholder="e.g. HDFC Bank" value={lender} onChange={(e) => setLender(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Total Loan Amount (₹)</Label>
              <Input type="number" placeholder="500000" className="font-mono" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              {errors.totalAmount && <p className="text-xs text-destructive mt-0.5">{errors.totalAmount}</p>}
            </div>
            <div>
              <Label className="text-xs">Monthly EMI (₹)</Label>
              <Input type="number" placeholder="15000" className="font-mono" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} />
              {errors.emiAmount && <p className="text-xs text-destructive mt-0.5">{errors.emiAmount}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Interest Rate (%)</Label>
              <Input type="number" placeholder="9.5" className="font-mono" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Tenure (months)</Label>
              <Input type="number" placeholder="36" className="font-mono" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} />
              {errors.tenureMonths && <p className="text-xs text-destructive mt-0.5">{errors.tenureMonths}</p>}
            </div>
            <div>
              <Label className="text-xs">Already Paid</Label>
              <Input type="number" placeholder="0" className="font-mono" value={paidCount} onChange={(e) => setPaidCount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Due Day (of month)</Label>
              <Input type="number" min="1" max="31" placeholder="5" className="font-mono" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          {creditCardAccounts.length > 0 && (
            <div>
              <Label className="text-xs">Linked Credit Card (optional)</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger><SelectValue placeholder="None — direct loan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — direct loan</SelectItem>
                  {creditCardAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-0.5">For EMIs billed to a credit card (e.g. iPhone EMI on HDFC card)</p>
            </div>
          )}
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Save EMI
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Add Lending Dialog =====

function AddLendingDialog({ onAdd, bankAccounts }: {
  onAdd: (data: Omit<Lending, "id" | "createdAt">, accountId?: number) => Promise<unknown>;
  bankAccounts: { id?: number; name: string; balance: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Lending["type"]>("lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setType("lent"); setPersonName(""); setAmount(""); setDescription("");
    setDate(new Date().toISOString().split("T")[0]); setDueDate(""); setFromAccount(""); setErrors({});
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(personName, "Person name");
    if (nameErr) errs.personName = nameErr;
    const amtErr = validateAmount(amount);
    if (amtErr) errs.amount = amtErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const amt = parseFloat(amount);
    const accountId = fromAccount ? parseInt(fromAccount) : undefined;
    await onAdd({
      type,
      personName,
      amount: amt,
      remainingAmount: amt,
      description: description || `${type === "lent" ? "Lent to" : "Borrowed from"} ${personName}`,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: "pending",
      currency: "INR",
    }, accountId);
    reset();
    setOpen(false);
    toast.success(`${type === "lent" ? "Lending" : "Borrowing"} recorded!`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Lend or Borrow</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={type === "lent" ? "default" : "outline"}
              className={type === "lent" ? "gradient-primary border-0" : ""}
              onClick={() => setType("lent")}
            >
              <ArrowUpRight className="h-4 w-4 mr-1" /> I Gave
            </Button>
            <Button
              variant={type === "borrowed" ? "default" : "outline"}
              className={type === "borrowed" ? "gradient-primary border-0" : ""}
              onClick={() => setType("borrowed")}
            >
              <ArrowDownLeft className="h-4 w-4 mr-1" /> I Received
            </Button>
          </div>
          <div>
            <Label className="text-xs">Person Name</Label>
            <Input placeholder="e.g. Rahul" value={personName} onChange={(e) => setPersonName(e.target.value)} />
            {errors.personName && <p className="text-xs text-destructive mt-0.5">{errors.personName}</p>}
          </div>
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input type="number" placeholder="5000" className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount}</p>}
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input placeholder="What's it for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Expected Return Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {bankAccounts.length > 0 && (
            <div>
              <Label className="text-xs">{type === "lent" ? "Paid From" : "Received In"}</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name} — ₹{acc.balance.toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {type === "lent" ? "Balance will be deducted from this account" : "Balance will be added to this account"}
              </p>
            </div>
          )}
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Record Payment Dialog =====

function RecordPaymentDialog({ lending, onPay }: { lending: Lending; onPay: (id: number, amount: number) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const { format: fmt } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <IndianRupee className="h-3 w-3 mr-1" /> Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {lending.type === "lent" ? `${lending.personName} is paying you back` : `You're paying back ${lending.personName}`}
          </p>
          <p className="text-sm">Remaining: <span className="font-mono font-bold text-primary">{fmt(lending.remainingAmount)}</span></p>
          <div className="flex gap-2">
            {[lending.remainingAmount * 0.25, lending.remainingAmount * 0.5, lending.remainingAmount].map((v) => (
              <Button key={v} variant="outline" size="sm" className="text-xs font-mono flex-1" onClick={() => setAmount(String(Math.round(v)))}>
                {fmt(Math.round(v))}
              </Button>
            ))}
          </div>
          <Input type="number" placeholder="Amount" className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button
            className="w-full gradient-primary border-0"
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={async () => {
              await onPay(lending.id!, parseFloat(amount));
              setOpen(false);
              setAmount("");
              toast.success("Payment recorded!");
            }}
          >
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Main Page =====

export default function EMILendings() {
  const { activeEMIs, completedEMIs, totalMonthlyEMI, totalOutstanding, addEMI, deleteEMI, payEMI } = useEMIs();
  const { lent, borrowed, pendingLent, pendingBorrowed, totalLentOut, totalBorrowed, addLending, deleteLending, recordPayment, settle } = useLendings();
  const { accounts } = useAccounts();
  const bankAccounts = accounts.filter((a) => a.type !== "credit_card");
  const { format: fmt } = useCurrency();

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">EMI & Lendings</h1>
            <p className="text-sm text-muted-foreground">Track your loans, EMIs, and money lent or borrowed</p>
          </div>
        </div>

        <Tabs defaultValue="emi" className="space-y-6">
          <TabsList>
            <TabsTrigger value="emi" className="gap-1.5"><CreditCard className="h-4 w-4" /> EMI Tracker</TabsTrigger>
            <TabsTrigger value="lendings" className="gap-1.5"><Users className="h-4 w-4" /> Lend / Borrow</TabsTrigger>
          </TabsList>

          {/* ===== EMI TAB ===== */}
          <TabsContent value="emi" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Monthly EMI Outflow</p>
                  <p className="text-2xl font-bold font-mono text-destructive">{fmt(totalMonthlyEMI)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold font-mono">{fmt(totalOutstanding)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Active EMIs</p>
                  <p className="text-2xl font-bold font-mono text-primary">{activeEMIs.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Add button */}
            <div className="flex justify-end">
              <AddEMIDialog onAdd={addEMI} />
            </div>

            {/* Active EMI List */}
            <div className="space-y-4">
              {activeEMIs.map((emi) => {
                const Icon = getEMIIcon(emi.type);
                const pct = Math.round((emi.paidCount / emi.tenureMonths) * 100);
                const remaining = emi.tenureMonths - emi.paidCount;
                const now = new Date();
                const today = now.getDate();
                // Check if Mark Paid was clicked this month
                const lastPaid = emi.lastPaidDate ? new Date(emi.lastPaidDate) : null;
                const paidThisMonth = lastPaid
                  ? lastPaid.getFullYear() === now.getFullYear() && lastPaid.getMonth() === now.getMonth()
                  : !lastPaid; // No lastPaidDate = legacy EMI, don't show overdue until next month
                const isDueSoon = !paidThisMonth && emi.dueDay - today <= 3 && emi.dueDay - today >= 0;
                const isOverdue = !paidThisMonth && today > emi.dueDay;

                return (
                  <motion.div
                    key={emi.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm truncate">{emi.name}</h3>
                                {isDueSoon && <Badge variant="outline" className="text-xs h-5 text-warning border-warning shrink-0">Due Soon</Badge>}
                                {isOverdue && <Badge variant="destructive" className="text-xs h-5 shrink-0">Overdue</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{emi.lender} · {emi.interestRate}% p.a. · Due: {emi.dueDay}th</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-xs"
                              onClick={async () => { await payEMI(emi.id!); toast.success("EMI marked as paid!"); }}
                            >
                              <Check className="h-3 w-3 mr-1" /> Mark Paid
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              onClick={async () => { await deleteEMI(emi.id!); toast.success("EMI deleted"); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Monthly EMI</p>
                            <p className="text-sm font-bold font-mono">{fmt(emi.emiAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Loan</p>
                            <p className="text-sm font-mono">{fmt(emi.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className="text-sm font-mono">{remaining}/{emi.tenureMonths} mo</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{emi.paidCount} paid</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {activeEMIs.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No active EMIs</p>
                  <p className="text-xs mt-1">Add your car loan, personal loan, or any EMI to track payments</p>
                </div>
              )}
            </div>

            {/* Completed EMIs */}
            {completedEMIs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Completed</h3>
                {completedEMIs.map((emi) => {
                  const Icon = getEMIIcon(emi.type);
                  return (
                    <div key={emi.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm line-through opacity-60">{emi.name}</p>
                          <p className="text-xs text-muted-foreground">{emi.lender} &middot; {fmt(emi.totalAmount)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-success border-success text-[10px]">
                        <Check className="h-3 w-3 mr-1" /> Paid Off
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== LENDINGS TAB ===== */}
          <TabsContent value="lendings" className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    <p className="text-xs text-muted-foreground">Money I Gave (to get back)</p>
                  </div>
                  <p className="text-2xl font-bold font-mono text-success">{fmt(totalLentOut)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pendingLent.length} pending</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownLeft className="h-4 w-4 text-destructive" />
                    <p className="text-xs text-muted-foreground">Money I Owe</p>
                  </div>
                  <p className="text-2xl font-bold font-mono text-destructive">{fmt(totalBorrowed)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pendingBorrowed.length} pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Add button */}
            <div className="flex justify-end">
              <AddLendingDialog onAdd={addLending} bankAccounts={bankAccounts} />
            </div>

            {/* Lent list */}
            {pendingLent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-success" /> Money I Gave
                </h3>
                <div className="space-y-3">
                  {pendingLent.map((l) => {
                    const pct = Math.round(((l.amount - l.remainingAmount) / l.amount) * 100);
                    const isOverdue = l.dueDate && new Date(l.dueDate) < new Date() && l.status !== "settled";
                    return (
                      <Card key={l.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{l.personName}</h4>
                                <Badge variant={l.status === "partial" ? "secondary" : "outline"} className="text-xs h-5">
                                  {l.status === "partial" ? "Partially Paid" : "Pending"}
                                </Badge>
                                {isOverdue && <Badge variant="destructive" className="text-xs h-5">Overdue</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{l.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <RecordPaymentDialog lending={l} onPay={recordPayment} />
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-success" onClick={async () => { await settle(l.id!); toast.success("Settled!"); }}>
                                <Check className="h-3 w-3 mr-1" /> Settle
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={async () => { await deleteLending(l.id!); toast.success("Deleted"); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>Total: <span className="font-mono">{fmt(l.amount)}</span></span>
                            <span>Remaining: <span className="font-mono font-medium text-foreground">{fmt(l.remainingAmount)}</span></span>
                            {l.dueDate && <span>Due: {new Date(l.dueDate).toLocaleDateString()}</span>}
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Borrowed list */}
            {pendingBorrowed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-destructive" /> Money I Owe
                </h3>
                <div className="space-y-3">
                  {pendingBorrowed.map((l) => {
                    const pct = Math.round(((l.amount - l.remainingAmount) / l.amount) * 100);
                    const isOverdue = l.dueDate && new Date(l.dueDate) < new Date() && l.status !== "settled";
                    return (
                      <Card key={l.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{l.personName}</h4>
                                <Badge variant={l.status === "partial" ? "secondary" : "outline"} className="text-xs h-5">
                                  {l.status === "partial" ? "Partially Paid" : "Pending"}
                                </Badge>
                                {isOverdue && <Badge variant="destructive" className="text-xs h-5">Overdue</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{l.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <RecordPaymentDialog lending={l} onPay={recordPayment} />
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-success" onClick={async () => { await settle(l.id!); toast.success("Settled!"); }}>
                                <Check className="h-3 w-3 mr-1" /> Settle
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={async () => { await deleteLending(l.id!); toast.success("Deleted"); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>Total: <span className="font-mono">{fmt(l.amount)}</span></span>
                            <span>Remaining: <span className="font-mono font-medium text-foreground">{fmt(l.remainingAmount)}</span></span>
                            {l.dueDate && <span>Due: {new Date(l.dueDate).toLocaleDateString()}</span>}
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Settled entries */}
            {[...lent.filter((l) => l.status === "settled"), ...borrowed.filter((l) => l.status === "settled")].length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Settled</h3>
                {[...lent.filter((l) => l.status === "settled"), ...borrowed.filter((l) => l.status === "settled")].map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      {l.type === "lent" ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownLeft className="h-3 w-3 text-destructive" />}
                      <span className="text-sm opacity-60">{l.personName}</span>
                      <span className="text-xs font-mono text-muted-foreground">{fmt(l.amount)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-success border-success">Settled</Badge>
                  </div>
                ))}
              </div>
            )}

            {pendingLent.length === 0 && pendingBorrowed.length === 0 && lent.filter((l) => l.status === "settled").length === 0 && borrowed.filter((l) => l.status === "settled").length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No entries yet</p>
                <p className="text-xs mt-1">Track money you've lent to friends or borrowed from anyone</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
