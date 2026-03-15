import { useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { addMonths, addWeeks, addDays, addYears, startOfDay, isBefore } from "date-fns";
import { toast } from "sonner";

/**
 * Checks for recurring transactions and auto-creates new entries
 * when they're due. Runs once on mount.
 */
export function useRecurringTransactions() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    processRecurring().catch(console.error);
  }, []);
}

async function processRecurring() {
  const today = startOfDay(new Date());
  const recurring = await db.transactions
    .filter((t) => t.isRecurring === true)
    .toArray();

  // Group by description + category + amount to find the latest instance
  const groups = new Map<string, typeof recurring>();
  for (const tx of recurring) {
    const key = `${tx.description}|${tx.category}|${tx.amount}|${tx.type}|${tx.recurringFrequency}`;
    const group = groups.get(key) || [];
    group.push(tx);
    groups.set(key, group);
  }

  let created = 0;

  for (const [, txs] of groups) {
    // Find the latest transaction in this group
    const sorted = txs.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latest = sorted[0];
    if (!latest.recurringFrequency) continue;

    // Calculate next due date
    let nextDate: Date;
    switch (latest.recurringFrequency) {
      case "daily": nextDate = addDays(latest.date, 1); break;
      case "weekly": nextDate = addWeeks(latest.date, 1); break;
      case "monthly": nextDate = addMonths(latest.date, 1); break;
      case "yearly": nextDate = addYears(latest.date, 1); break;
      default: continue;
    }

    // Create entries for all missed dates up to today
    while (isBefore(startOfDay(nextDate), today) || startOfDay(nextDate).getTime() === today.getTime()) {
      await db.transactions.add({
        type: latest.type,
        amount: latest.amount,
        currency: latest.currency,
        category: latest.category,
        description: latest.description,
        accountId: latest.accountId,
        date: nextDate,
        isRecurring: true,
        recurringFrequency: latest.recurringFrequency,
        createdAt: new Date(),
        addedVia: "manual",
      });

      // Update account balance
      const delta = latest.type === "income" ? latest.amount
        : latest.type === "expense" || latest.type === "withdrawal" ? -latest.amount
        : 0;
      if (delta !== 0) {
        const account = await db.accounts.get(latest.accountId);
        if (account) {
          await db.accounts.update(latest.accountId, {
            balance: account.balance + delta,
            updatedAt: new Date(),
          });
        }
      }

      created++;

      // Advance to next
      switch (latest.recurringFrequency) {
        case "daily": nextDate = addDays(nextDate, 1); break;
        case "weekly": nextDate = addWeeks(nextDate, 1); break;
        case "monthly": nextDate = addMonths(nextDate, 1); break;
        case "yearly": nextDate = addYears(nextDate, 1); break;
      }
    }
  }

  if (created > 0) {
    toast.info(`${created} recurring transaction${created > 1 ? "s" : ""} auto-added.`);
  }
}
