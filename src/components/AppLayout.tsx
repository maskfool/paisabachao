import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Receipt, Target, BarChart3, Settings,
  Menu, X, LogOut, Moon, Sun, ChevronLeft, CircleDollarSign, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/chat", label: "AI Chat", icon: MessageSquare },
  { path: "/transactions", label: "Transactions", icon: Receipt },
  { path: "/goals", label: "Goals & Budgets", icon: Target },
  { path: "/emi", label: "EMI & Lendings", icon: CircleDollarSign },
  { path: "/credit-cards", label: "Credit Cards", icon: Wallet },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);
  useKeyboardShortcuts();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  if (typeof window !== "undefined" && !document.documentElement.classList.contains("dark") && dark) {
    document.documentElement.classList.add("dark");
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userInitial = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";
  const userName = user?.firstName || "User";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        className="hidden lg:flex flex-col border-r border-border bg-card"
      >
        <div className={cn("flex items-center gap-3 p-4 border-b border-border", collapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-bold text-lg tracking-tight">PaisaBachao</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Finance</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          {/* User info */}
          {user && (
            <div className={cn("flex items-center gap-3 px-3 py-2 mb-1", collapsed && "justify-center px-2")}>
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="h-7 w-7 rounded-full shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                  {userInitial}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={toggleDark}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {dark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header + Overlay */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">P</span>
            </div>
            <span className="font-bold">PaisaBachao</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.imageUrl && (
              <img src={user.imageUrl} alt="" className="h-7 w-7 rounded-full" />
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card border-l border-border p-4 lg:hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile user info */}
                {user && (
                  <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-lg bg-secondary/50">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {userInitial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
                    </div>
                  </div>
                )}

                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                        <div className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-6 pt-4 border-t border-border space-y-1">
                  <button onClick={toggleDark} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full">
                    {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>{dark ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full">
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
