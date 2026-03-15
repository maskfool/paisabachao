import Dexie, { type EntityTable } from "dexie";
import type { Account, Transaction, Goal, Budget, ChatMessage, UserSettings, MonthlyIncome } from "@/types";

const db = new Dexie("PaisaBachao") as Dexie & {
  accounts: EntityTable<Account, "id">;
  transactions: EntityTable<Transaction, "id">;
  goals: EntityTable<Goal, "id">;
  budgets: EntityTable<Budget, "id">;
  chatMessages: EntityTable<ChatMessage, "id">;
  settings: EntityTable<UserSettings, "id">;
  monthlyIncomes: EntityTable<MonthlyIncome, "id">;
};

db.version(1).stores({
  accounts: "++id, name, type, createdAt",
  transactions: "++id, type, category, accountId, date, createdAt, addedVia",
  goals: "++id, status, category, deadline",
  budgets: "++id, category, period",
  chatMessages: "++id, sessionId, timestamp",
  settings: "++id, &key",
});

db.version(2).stores({
  accounts: "++id, name, type, createdAt",
  transactions: "++id, type, category, accountId, date, createdAt, addedVia",
  goals: "++id, status, category, deadline",
  budgets: "++id, category, period",
  chatMessages: "++id, sessionId, timestamp",
  settings: "++id, &key",
  monthlyIncomes: "++id, &month, createdAt",
});

export { db };
