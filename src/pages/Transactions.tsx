import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Trash2, MessageSquare, Receipt, Pencil, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES } from "@/lib/constants";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCurrency } from "@/hooks/useCurrency";
import { validateAmount, validateRequired } from "@/lib/validation";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import type { Transaction } from "@/types";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

type TransactionType = Transaction["type"];

function TransactionForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, "id" | "createdAt">) => Promise<unknown>;
  submitLabel: string;
}) {
  const { accounts } = useAccounts();
  const [type, setType] = useState<TransactionType>((initial?.type as TransactionType) || "expense");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState<number | undefined>(initial?.accountId);
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState(initial?.recurringFrequency || "monthly");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const amtErr = validateAmount(amount);
    if (amtErr) errs.amount = amtErr;
    const catErr = validateRequired(category, "Category");
    if (catErr) errs.category = catErr;
    const descErr = validateRequired(description, "Description");
    if (descErr) errs.description = descErr;
    if (!date) errs.date = "Date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const aid = accountId ?? accounts[0]?.id;
    if (!aid) { toast.error("No account found. Add an account first."); return; }

    await onSubmit({
      type,
      amount: parseFloat(amount),
      currency: "INR",
      category,
      description,
      accountId: aid,
      date: new Date(date),
      addedVia: initial?.addedVia || "manual",
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency as Transaction["recurringFrequency"] : undefined,
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Amount (₹)</Label>
          <Input type="number" placeholder="0.00" className="font-mono" value={amount} onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }} />
          {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount}</p>}
        </div>
      </div>
      {accounts.length > 1 && (
        <div>
          <Label className="text-xs">Account</Label>
          <Select value={String(accountId ?? accounts[0]?.id ?? "")} onValueChange={(v) => setAccountId(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
        <Label className="text-xs">Description</Label>
        <Input placeholder="What was this for?" value={description} onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }} />
        {errors.description && <p className="text-xs text-destructive mt-0.5">{errors.description}</p>}
      </div>
      <div>
        <Label className="text-xs">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Recurring</p>
          <p className="text-xs text-muted-foreground">Auto-repeat this transaction</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
      {isRecurring && (
        <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}

function AddTransactionDialog({ onAdd }: { onAdd: (data: Omit<Transaction, "id" | "createdAt">) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
        <TransactionForm
          onSubmit={async (data) => {
            await onAdd(data);
            setOpen(false);
            toast.success("Transaction added!");
          }}
          submitLabel="Save Transaction"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditTransactionDialog({
  transaction,
  onUpdate,
  onDelete,
}: {
  transaction: Transaction;
  onUpdate: (id: number, changes: Partial<Transaction>) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
        <TransactionForm
          initial={transaction}
          onSubmit={async (data) => {
            if (!transaction.id) return;
            await onUpdate(transaction.id, data);
            setOpen(false);
            toast.success("Transaction updated!");
          }}
          submitLabel="Update Transaction"
        />
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={async () => {
              if (!transaction.id) return;
              await onDelete(transaction.id);
              setOpen(false);
              toast.success("Transaction deleted.");
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions({
    search,
    type: typeFilter,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
  });
  const { format: fmt } = useCurrency();

  const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    expense: { label: "Expense", variant: "destructive" },
    income: { label: "Income", variant: "default" },
    investment: { label: "Investment", variant: "secondary" },
    withdrawal: { label: "Withdrawal", variant: "outline" },
    transfer: { label: "Transfer", variant: "outline" },
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-sm text-muted-foreground">{transactions.length} transactions found</p>
          </div>
          <div className="flex gap-2">
            <AddTransactionDialog onAdd={addTransaction} />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions... (Ctrl+K)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-0"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="investment">Investments</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showDateFilter ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowDateFilter(!showDateFilter)}
              title="Date range filter"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          {showDateFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row gap-3 items-end"
            >
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-0" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-0" />
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                  Clear
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Transaction List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {transactions.map((tx, i) => {
                const cat = getCategory(tx.category);
                const isExpense = tx.type === "expense" || tx.type === "withdrawal";
                const badge = typeBadge[tx.type] ?? typeBadge.expense;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}15` }}>
                        {cat && <cat.icon className="h-5 w-5" style={{ color: cat.color }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{tx.description}</p>
                          {tx.addedVia === "chat" && (
                            <MessageSquare className="h-3 w-3 text-primary shrink-0" title="Added via AI chat" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</span>
                          <Badge variant={badge.variant} className="text-[10px] h-4 px-1.5">{badge.label}</Badge>
                          {tx.isRecurring && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{tx.recurringFrequency}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono font-semibold ${isExpense ? "text-destructive" : "text-success"}`}>
                        {isExpense ? "-" : "+"}{fmt(tx.amount)}
                      </span>
                      <EditTransactionDialog
                        transaction={tx}
                        onUpdate={updateTransaction}
                        onDelete={deleteTransaction}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => tx.id && deleteTransaction(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {transactions.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No transactions yet</p>
                  <p className="text-xs mt-1">Add your first transaction to start tracking your finances</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
