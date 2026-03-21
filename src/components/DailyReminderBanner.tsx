import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodayTransactions } from "@/hooks/useReminder";
import { useSettings } from "@/hooks/useSettings";

export default function DailyReminderBanner() {
  const { hasLoggedToday, todayCount } = useTodayTransactions();
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  // Only show if reminders are enabled and user hasn't logged today
  const reminderEnabled = settings.reminderEnabled === "true";
  if (!reminderEnabled || hasLoggedToday || dismissed) return null;

  // Only show after 12 PM (noon) so it doesn't nag in the morning
  const hour = new Date().getHours();
  if (hour < 12) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mt-4 md:mx-8"
      >
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">No expenses logged today</p>
            <p className="text-xs text-muted-foreground">Track your spending to stay on budget</p>
          </div>
          <Link to="/chat">
            <Button size="sm" className="gradient-primary border-0 shrink-0">
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Log Now
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
