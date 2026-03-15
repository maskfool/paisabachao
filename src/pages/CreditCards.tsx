import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, Trash2, IndianRupee, Calendar, AlertTriangle,
  Check, TrendingUp, Wallet, Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useCurrency } from "@/hooks/useCurrency";
import { validateAmount, validateRequired } from "@/lib/validation";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

function AddCreditCardDialog({ onAdd }: { onAdd: (data: { name: string; creditLimit: number; billingDate: number; dueDate: number; minimumDuePercentage: number; currentOutstanding?: number }) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [billingDate, setBillingDate] = useState("1");
  const [dueDate, setDueDate] = useState("15");
  const [minDue, setMinDue] = useState("5");
  const [outstanding, setOutstanding] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName(""); setCreditLimit(""); setBillingDate("1"); setDueDate("15");
    setMinDue("5"); setOutstanding(""); setErrors({});
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(name, "Card name");
    if (nameErr) errs.name = nameErr;
    const limitErr = validateAmount(creditLimit);
    if (limitErr) errs.creditLimit = limitErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await onAdd({
      name,
      creditLimit: parseFloat(creditLimit),
      billingDate: parseInt(billingDate) || 1,
      dueDate: parseInt(dueDate) || 15,
      minimumDuePercentage: parseFloat(minDue) || 5,
      currentOutstanding: outstanding ? parseFloat(outstanding) : 0,
    });
    reset();
    setOpen(false);
    toast.success("Credit card added!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-1" /> Add Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs">Card Name</Label>
            <Input placeholder="e.g. HDFC Regalia" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Credit Limit (₹)</Label>
              <Input type="number" placeholder="200000" className="font-mono" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              {errors.creditLimit && <p className="text-xs text-destructive mt-0.5">{errors.creditLimit}</p>}
            </div>
            <div>
              <Label className="text-xs">Current Outstanding (₹)</Label>
              <Input type="number" placeholder="0" className="font-mono" value={outstanding} onChange={(e) => setOutstanding(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Bill Date (day)</Label>
              <Input type="number" min="1" max="31" placeholder="1" className="font-mono" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Due Date (day)</Label>
              <Input type="number" min="1" max="31" placeholder="15" className="font-mono" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Min Due (%)</Label>
              <Input type="number" placeholder="5" className="font-mono" value={minDue} onChange={(e) => setMinDue(e.target.value)} />
            </div>
          </div>
          <Button className="w-full gradient-primary border-0" onClick={handleSubmit}>
            Save Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCardDialog({ card, onUpdate }: {
  card: { id?: number; name: string; creditLimit?: number; billingDate?: number; dueDate?: number; minimumDuePercentage?: number };
  onUpdate: (id: number, changes: Record<string, unknown>) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(card.name);
  const [creditLimit, setCreditLimit] = useState(String(card.creditLimit ?? ""));
  const [billingDate, setBillingDate] = useState(String(card.billingDate ?? "1"));
  const [dueDate, setDueDate] = useState(String(card.dueDate ?? "15"));
  const [minDue, setMinDue] = useState(String(card.minimumDuePercentage ?? "5"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit {card.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs">Card Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Credit Limit (₹)</Label>
            <Input type="number" className="font-mono" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Bill Date</Label>
              <Input type="number" min="1" max="31" className="font-mono" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="number" min="1" max="31" className="font-mono" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Min Due %</Label>
              <Input type="number" className="font-mono" value={minDue} onChange={(e) => setMinDue(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full gradient-primary border-0"
            onClick={async () => {
              if (!card.id) return;
              await onUpdate(card.id, {
                name,
                creditLimit: parseFloat(creditLimit) || 0,
                billingDate: parseInt(billingDate) || 1,
                dueDate: parseInt(dueDate) || 15,
                minimumDuePercentage: parseFloat(minDue) || 5,
              });
              setOpen(false);
              toast.success("Card updated!");
            }}
          >
            Update Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CreditCardsPage() {
  const { creditCards, totalOutstanding, totalCreditLimit, totalAvailable, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards();
  const { format: fmt } = useCurrency();

  const utilizationColor = (pct: number) =>
    pct > 70 ? "text-destructive" : pct > 30 ? "text-warning" : "text-success";

  const utilizationBarColor = (pct: number) =>
    pct > 70 ? "bg-destructive" : pct > 30 ? "bg-warning" : "bg-success";

  const totalUtilization = totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Credit Cards</h1>
            <p className="text-sm text-muted-foreground">Track outstanding, limits, billing dates & linked EMIs</p>
          </div>
          <AddCreditCardDialog onAdd={addCreditCard} />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold font-mono text-destructive">{fmt(totalOutstanding)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Limit</p>
              <p className="text-2xl font-bold font-mono">{fmt(totalCreditLimit)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className="text-2xl font-bold font-mono text-success">{fmt(totalAvailable)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Utilization</p>
              <p className={`text-2xl font-bold font-mono ${utilizationColor(totalUtilization)}`}>{totalUtilization}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Card List */}
        <div className="space-y-4">
          {creditCards.map((card) => {
            const today = new Date().getDate();
            const isDueSoon = card.dueDate && card.dueDate - today <= 5 && card.dueDate - today >= 0 && card.outstanding > 0;
            const isBillingSoon = card.billingDate && card.billingDate - today <= 3 && card.billingDate - today >= 0;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{card.name}</h3>
                            {isDueSoon && (
                              <Badge variant="destructive" className="text-[10px] h-4">
                                <AlertTriangle className="h-3 w-3 mr-0.5" /> Payment Due Soon
                              </Badge>
                            )}
                            {isBillingSoon && (
                              <Badge variant="outline" className="text-[10px] h-4 text-warning border-warning">
                                Bill Generating Soon
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {card.billingDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Bill: {card.billingDate}th
                              </span>
                            )}
                            {card.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Due: {card.dueDate}th
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <EditCardDialog card={card} onUpdate={updateCreditCard} />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={async () => {
                            await deleteCreditCard(card.id!);
                            toast.success("Card deleted");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          Used: <span className="font-mono font-medium text-foreground">{fmt(card.outstanding)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Limit: <span className="font-mono">{fmt(card.creditLimit ?? 0)}</span>
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(card.utilizationPercent, 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${utilizationBarColor(card.utilizationPercent)}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] mt-1">
                        <span className={utilizationColor(card.utilizationPercent)}>{card.utilizationPercent}% used</span>
                        <span className="text-success">Available: {fmt(card.availableLimit)}</span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Outstanding</p>
                        <p className="text-sm font-bold font-mono text-destructive">{fmt(card.outstanding)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Minimum Due</p>
                        <p className="text-sm font-bold font-mono">{fmt(card.minimumDue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">EMIs on Card</p>
                        <p className="text-sm font-bold font-mono">{fmt(card.emiMonthlyTotal)}<span className="text-[10px] text-muted-foreground font-normal">/mo</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Next Due</p>
                        <p className="text-sm font-medium">{card.nextDueDate ? card.nextDueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</p>
                      </div>
                    </div>

                    {/* Linked EMIs */}
                    {card.linkedEMIs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Linked EMIs</p>
                        <div className="space-y-1.5">
                          {card.linkedEMIs.map((emi) => (
                            <div key={emi.id} className="flex items-center justify-between text-xs">
                              <span>{emi.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{fmt(emi.emiAmount)}/mo</span>
                                <span className="text-muted-foreground">{emi.paidCount}/{emi.tenureMonths}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {creditCards.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No credit cards added</p>
              <p className="text-xs mt-1">Add your credit cards to track outstanding, limits, and payment dates</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
