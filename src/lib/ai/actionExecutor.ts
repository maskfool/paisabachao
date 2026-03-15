import { db } from "@/lib/db";
import type { AIAction } from "@/types";

/**
 * Executes a parsed AI action against the Dexie database.
 * Returns a human-readable result string.
 */
export async function executeAction(action: AIAction): Promise<string> {
  try {
    switch (action.action) {
      case "add_transaction": {
        const d = action.data as {
          type: string;
          amount: number;
          currency?: string;
          category: string;
          description: string;
          date?: string;
        };

        // Get default account
        const accounts = await db.accounts.toArray();
        const accountId = accounts[0]?.id;
        if (!accountId) return "No accounts found. Please add an account in Settings first.";

        const txDate = d.date ? new Date(d.date) : new Date();

        await db.transactions.add({
          type: d.type as "expense" | "income" | "investment" | "withdrawal",
          amount: d.amount,
          currency: d.currency || "USD",
          category: d.category,
          description: d.description,
          accountId,
          date: txDate,
          createdAt: new Date(),
          addedVia: "chat",
        });

        // Update account balance
        const delta = d.type === "income" ? d.amount
          : d.type === "expense" || d.type === "withdrawal" ? -d.amount
          : 0;
        if (delta !== 0) {
          const account = await db.accounts.get(accountId);
          if (account) {
            await db.accounts.update(accountId, {
              balance: account.balance + delta,
              updatedAt: new Date(),
            });
          }
        }

        return action.confirmation || `Transaction added: $${d.amount} ${d.type}`;
      }

      case "update_goal": {
        const d = action.data as { goalId: number; addAmount: number };
        const goal = await db.goals.get(d.goalId);
        if (!goal) return "Goal not found.";

        const newAmount = goal.currentAmount + d.addAmount;
        await db.goals.update(d.goalId, {
          currentAmount: newAmount,
          status: newAmount >= goal.targetAmount ? "completed" : goal.status,
          updatedAt: new Date(),
        });

        return action.confirmation || `Added $${d.addAmount} to "${goal.title}"`;
      }

      case "set_budget": {
        const d = action.data as { category: string; limit: number; period?: string };
        const existing = await db.budgets.where("category").equals(d.category).first();

        if (existing) {
          await db.budgets.update(existing.id!, { limit: d.limit });
          return action.confirmation || `Updated ${d.category} budget to $${d.limit}`;
        }

        await db.budgets.add({
          category: d.category,
          limit: d.limit,
          spent: 0,
          currency: "USD",
          period: (d.period as "monthly" | "yearly") || "monthly",
          alertThreshold: 80,
          createdAt: new Date(),
        });

        return action.confirmation || `Created ${d.category} budget: $${d.limit}/month`;
      }

      default:
        return action.confirmation || "Action noted.";
    }
  } catch (err) {
    console.error("Action execution failed:", err);
    return "Failed to execute action. Please try again.";
  }
}
