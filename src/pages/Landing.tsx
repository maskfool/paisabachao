import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Brain, Target, TrendingDown, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Brain, title: "Strict AI Advisor", desc: "AI that says NO when spending hurts your goals" },
  { icon: Shield, title: "Bank-Grade Security", desc: "All data encrypted and stored locally per user" },
  { icon: Target, title: "Goal Enforcement", desc: "Set budgets — AI enforces them ruthlessly" },
  { icon: TrendingDown, title: "Impulse Control", desc: "Ask before you buy. AI checks if you can afford it" },
  { icon: MessageSquare, title: "Chat to Log", desc: "\"I spent ₹500 on groceries\" — done" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Know exactly where every dollar goes" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight">SmartSpend</span>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="gradient-primary border-0">
              Get Started
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Your money. Your rules. AI enforced.
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Stop <span className="text-gradient">Overspending.</span>
                <br />Start <span className="text-gradient">Building Wealth.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
                An AI finance advisor that won't sugarcoat it. Set goals, track every rupee and dollar, and get a strict YES or NO before every purchase.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="gradient-primary border-0 text-base px-8 py-6 rounded-xl shadow-lg animate-pulse-glow"
                onClick={() => navigate("/dashboard")}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                Explore Demo
              </Button>
            </motion.div>
          </div>

          {/* Mock Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-2xl font-bold font-mono text-primary">$12,450</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold font-mono text-destructive">-$2,368</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                  <p className="text-2xl font-bold font-mono text-warning">B+</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built for <span className="text-gradient">Discipline</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Not another pretty budget app. This one fights your impulses.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-muted-foreground mb-8">Join thousands who stopped guessing and started growing their wealth.</p>
          <Button size="lg" className="gradient-primary border-0 px-8 py-6 rounded-xl text-base" onClick={() => navigate("/dashboard")}>
            Start for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© 2026 SmartSpend AI. Your data never leaves your account.</p>
      </footer>
    </div>
  );
}
