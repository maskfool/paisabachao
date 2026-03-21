import { useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSettings } from "./useSettings";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Checks if the user has logged any transactions today.
 */
export function useTodayTransactions() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  const count = useLiveQuery(
    () => db.transactions.where("date").between(start, end, true, true).count(),
    []
  ) ?? 0;

  return { todayCount: count, hasLoggedToday: count > 0 };
}

/**
 * Requests notification permission from the browser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Sends a notification via the service worker (works even when tab is in background).
 */
async function sendNotification(body: string) {
  if (Notification.permission !== "granted") return;

  // Try service worker first (more reliable, works in background)
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({ type: "SHOW_REMINDER", body });
      return;
    }
  }

  // Fallback: direct notification
  new Notification("PaisaBachao", {
    body,
    icon: "/pwa-192x192.svg",
    tag: "daily-reminder",
  });
}

/**
 * Hook that schedules daily reminder notifications.
 * Reads reminder time from settings and fires notification at that time.
 */
export function useDailyReminder() {
  const { settings } = useSettings();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { hasLoggedToday } = useTodayTransactions();

  const reminderEnabled = settings.reminderEnabled === "true";
  const reminderTime = settings.reminderTime || "21:00"; // default 9 PM

  const scheduleReminder = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!reminderEnabled) return;
    if (Notification.permission !== "granted") return;

    const [hours, minutes] = reminderTime.split(":").map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // If target time already passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    timerRef.current = setTimeout(() => {
      // Only notify if no transactions logged today
      if (!hasLoggedToday) {
        sendNotification("You haven't logged any expenses today. Tap to add now!");
      }

      // Reschedule for tomorrow
      setTimeout(() => scheduleReminder(), 1000);
    }, delay);
  }, [reminderEnabled, reminderTime, hasLoggedToday]);

  useEffect(() => {
    scheduleReminder();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleReminder]);
}
