import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, ArrowUpDown, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MOCK_TRANSACTIONS, CATEGORIES, CURRENCIES, Transaction, TransactionType } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";

const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

function AddTransactionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select defaultValue="expense">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Amount</Label>
            <Input type="number" placeholder="0.00" className="font-mono" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input placeholder="What was this for?" />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" defaultValue="2026-03-09" />
          </div>
          <Button className="w-full gradient-primary border-0">Save Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = MOCK_TRANSACTIONS.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} transactions found</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
            <AddTransactionDialog />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
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
        </div>

        {/* Transaction List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((tx, i) => {
                const cat = getCategory(tx.category);
                const isExpense = tx.type === "expense" || tx.type === "withdrawal";
                const typeBadge: Record<TransactionType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
                  expense: { label: "Expense", variant: "destructive" },
                  income: { label: "Income", variant: "default" },
                  investment: { label: "Investment", variant: "secondary" },
                  withdrawal: { label: "Withdrawal", variant: "outline" },
                };
                const badge = typeBadge[tx.type];

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}15` }}>
                        {cat && <cat.icon className="h-5 w-5" style={{ color: cat.color }} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{tx.date}</span>
                          <Badge variant={badge.variant} className="text-[10px] h-4 px-1.5">{badge.label}</Badge>
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono font-semibold ${isExpense ? "text-destructive" : "text-success"}`}>
                      {isExpense ? "-" : "+"}${tx.amount.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
