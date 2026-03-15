import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts.
 * Ctrl+K / Cmd+K — Focus search (on transactions page)
 * Ctrl+N / Cmd+N — New transaction (navigates to transactions)
 * 1-6 — Quick navigate to pages
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't fire in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + K — search (focus search input on transactions)
      if (mod && e.key === "k") {
        e.preventDefault();
        navigate("/transactions");
        // Focus search after navigation
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
          input?.focus();
        }, 100);
        return;
      }

      // Ctrl/Cmd + N — new transaction
      if (mod && e.key === "n") {
        e.preventDefault();
        navigate("/transactions");
        return;
      }

      // Number shortcuts (no modifier)
      if (!mod && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case "1": navigate("/dashboard"); break;
          case "2": navigate("/chat"); break;
          case "3": navigate("/transactions"); break;
          case "4": navigate("/goals"); break;
          case "5": navigate("/emi"); break;
          case "6": navigate("/analytics"); break;
          case "7": navigate("/settings"); break;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
