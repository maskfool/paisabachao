import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Account, CreditCardSummary } from "@/types";

function getNextDate(dayOfMonth: number): Date {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (thisMonth > now) return thisMonth;
  return new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
}

export function useCreditCards() {
  const data = useLiveQuery(async () => {
    const accounts = await db.accounts.where("type").equals("credit_card").toArray();
    const allEmis = await db.emis.toArray();

    const cards: CreditCardSummary[] = accounts.map((acc) => {
      const outstanding = Math.max(0, -acc.balance); // spending makes balance negative
      const creditLimit = acc.creditLimit ?? 0;
      const availableLimit = creditLimit - outstanding;
      const utilizationPercent = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
      const minimumDue = Math.round(outstanding * (acc.minimumDuePercentage ?? 5) / 100);
      const linkedEMIs = allEmis.filter((e) => e.creditCardAccountId === acc.id && e.status === "active");
      const emiMonthlyTotal = linkedEMIs.reduce((sum, e) => sum + e.emiAmount, 0);
      const nextBillingDate = acc.billingDate ? getNextDate(acc.billingDate) : null;
      const nextDueDate = acc.dueDate ? getNextDate(acc.dueDate) : null;

      return {
        ...acc,
        outstanding,
        availableLimit,
        utilizationPercent,
        minimumDue,
        linkedEMIs,
        emiMonthlyTotal,
        nextBillingDate,
        nextDueDate,
      };
    });

    return cards;
  }) || [];

  const totalOutstanding = data.reduce((sum, c) => sum + c.outstanding, 0);
  const totalCreditLimit = data.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0);
  const totalAvailable = data.reduce((sum, c) => sum + c.availableLimit, 0);

  const addCreditCard = async (card: {
    name: string;
    creditLimit: number;
    billingDate: number;
    dueDate: number;
    minimumDuePercentage: number;
    currentOutstanding?: number;
  }) => {
    const now = new Date();
    return db.accounts.add({
      name: card.name,
      type: "credit_card",
      balance: -(card.currentOutstanding ?? 0), // negative = you owe
      currency: "INR",
      creditLimit: card.creditLimit,
      billingDate: card.billingDate,
      dueDate: card.dueDate,
      minimumDuePercentage: card.minimumDuePercentage,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateCreditCard = async (id: number, changes: Partial<Account>) => {
    return db.accounts.update(id, { ...changes, updatedAt: new Date() });
  };

  const deleteCreditCard = async (id: number) => {
    return db.accounts.delete(id);
  };

  return {
    creditCards: data,
    totalOutstanding,
    totalCreditLimit,
    totalAvailable,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  };
}
