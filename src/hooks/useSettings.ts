import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useSettings() {
  const settingsRows = useLiveQuery(() => db.settings.toArray()) ?? [];

  const settings = settingsRows.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  async function setSetting(key: string, value: string) {
    const existing = await db.settings.where("key").equals(key).first();
    if (existing) {
      return db.settings.update(existing.id!, { value, updatedAt: new Date() });
    }
    return db.settings.add({ key, value, updatedAt: new Date() });
  }

  async function getSetting(key: string): Promise<string | undefined> {
    const row = await db.settings.where("key").equals(key).first();
    return row?.value;
  }

  return { settings, setSetting, getSetting };
}
