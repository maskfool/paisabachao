import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Receipt, Target, BarChart3, Settings,
  Menu, X, LogOut, Moon, Sun, CircleDollarSign, Wallet, Search, Mic
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
        animate={{ width: collapsed ? 80 : 272 }}
        className="hidden lg:flex flex-col bg-card m-3 rounded-[2rem]"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
      >
        {/* Hamburger toggle */}
        <div className={cn("px-6 pt-6 pb-2", collapsed && "px-4 pt-4")}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <Menu className="h-5 w-5 text-primary" />
          </button>
        </div>

        <div className={cn("flex items-center gap-3 px-6 pb-4", collapsed && "justify-center px-4")}>
          <div className="h-10 w-10 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2 L28 7 C28 7 29 20 16 30 C3 20 4 7 4 7 Z" fill="white" opacity="0.9"/>
              <polyline points="10,20 13.5,15.5 17,17.5 23,11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
              <polygon points="21,9.5 24,9.5 24,12.5" fill="currentColor" className="text-primary"/>
            </svg>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-semibold text-lg tracking-tight">PaisaBachao</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Finance</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    collapsed && "justify-center px-3"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6 pt-3 space-y-1">
          {/* User info */}
          {user && (
            <div className={cn("flex items-center gap-3 px-4 py-3 mb-1", collapsed && "justify-center px-3")}>
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                  {userInitial}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={toggleDark}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-colors",
              collapsed && "justify-center px-3"
            )}
          >
            {dark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header + Overlay */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between bg-card mx-3 mt-3 px-5 py-3 rounded-full" style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2 L28 7 C28 7 29 20 16 30 C3 20 4 7 4 7 Z" fill="white" opacity="0.9"/>
                <polyline points="10,20 13.5,15.5 17,17.5 23,11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
                <polygon points="21,9.5 24,9.5 24,12.5" fill="currentColor" className="text-primary"/>
              </svg>
            </div>
            <span className="font-semibold">PaisaBachao</span>
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
                className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card p-5 lg:hidden rounded-l-[2rem]"
                style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.06)" }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile user info */}
                {user && (
                  <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl bg-secondary/50">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">
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
                          "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-6 pt-4 space-y-1">
                  <button onClick={toggleDark} className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full">
                    {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>{dark ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full">
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* AI Search Bar — visible on all screens */}
        <div
          className="flex mx-3 lg:mx-4 mt-3 h-12 lg:h-14 rounded-full bg-card items-center px-5 lg:px-6 gap-3 lg:gap-4 cursor-pointer hover:bg-card/80 transition-colors active:scale-[0.99]"
          style={{ boxShadow: "0 20px 50px rgba(0, 0, 0, 0.1)" }}
          onClick={() => navigate("/chat")}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1 truncate">Ask AI: How much can I spend today?</span>
          <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
