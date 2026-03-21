import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { Shield, Brain, Target, TrendingDown, MessageSquare, BarChart3, Loader2, ArrowRight, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Pixel Coin that follows mouse like a pet ---

const PIXEL_COIN_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="10" y="2" width="12" height="2" fill="#FFD700"/>
  <rect x="8" y="4" width="2" height="2" fill="#FFD700"/>
  <rect x="22" y="4" width="2" height="2" fill="#FFD700"/>
  <rect x="6" y="6" width="2" height="2" fill="#FFD700"/>
  <rect x="24" y="6" width="2" height="2" fill="#FFD700"/>
  <rect x="4" y="8" width="2" height="2" fill="#FFD700"/>
  <rect x="26" y="8" width="2" height="2" fill="#FFD700"/>
  <rect x="4" y="10" width="2" height="2" fill="#FFD700"/>
  <rect x="26" y="10" width="2" height="2" fill="#FFD700"/>
  <rect x="2" y="12" width="2" height="8" fill="#FFD700"/>
  <rect x="28" y="12" width="2" height="8" fill="#FFD700"/>
  <rect x="4" y="20" width="2" height="2" fill="#DAA520"/>
  <rect x="26" y="20" width="2" height="2" fill="#DAA520"/>
  <rect x="4" y="22" width="2" height="2" fill="#DAA520"/>
  <rect x="26" y="22" width="2" height="2" fill="#DAA520"/>
  <rect x="6" y="24" width="2" height="2" fill="#DAA520"/>
  <rect x="24" y="24" width="2" height="2" fill="#DAA520"/>
  <rect x="8" y="26" width="2" height="2" fill="#DAA520"/>
  <rect x="22" y="26" width="2" height="2" fill="#DAA520"/>
  <rect x="10" y="28" width="12" height="2" fill="#DAA520"/>
  <!-- Fill -->
  <rect x="10" y="4" width="12" height="2" fill="#FFC107"/>
  <rect x="8" y="6" width="16" height="2" fill="#FFC107"/>
  <rect x="6" y="8" width="20" height="2" fill="#FFCA28"/>
  <rect x="6" y="10" width="20" height="2" fill="#FFCA28"/>
  <rect x="4" y="12" width="24" height="8" fill="#FFD54F"/>
  <rect x="6" y="20" width="20" height="2" fill="#FFC107"/>
  <rect x="6" y="22" width="20" height="2" fill="#FFB300"/>
  <rect x="8" y="24" width="16" height="2" fill="#FFA000"/>
  <rect x="10" y="26" width="12" height="2" fill="#FF8F00"/>
  <!-- ₹ symbol -->
  <rect x="11" y="10" width="10" height="2" fill="#B8860B"/>
  <rect x="11" y="14" width="10" height="2" fill="#B8860B"/>
  <rect x="12" y="12" width="2" height="2" fill="#B8860B"/>
  <rect x="12" y="16" width="2" height="2" fill="#B8860B"/>
  <rect x="14" y="18" width="2" height="2" fill="#B8860B"/>
  <rect x="16" y="20" width="2" height="2" fill="#B8860B"/>
  <rect x="18" y="18" width="2" height="2" fill="#B8860B"/>
</svg>`)}`;

function CoinFollower() {
  const coinRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0 });
  const rotation = useRef(0);
  const frameRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    // Smooth follow animation loop
    const animate = () => {
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Smooth easing — like a pet trotting after you
      const ease = 0.08;
      velocity.current.x += dx * ease;
      velocity.current.y += dy * ease;
      velocity.current.x *= 0.75; // friction
      velocity.current.y *= 0.75;

      pos.current.x += velocity.current.x;
      pos.current.y += velocity.current.y;

      // Roll rotation based on horizontal movement
      rotation.current += velocity.current.x * 2;

      // Slight bounce when close to target
      const bounce = dist < 5 ? Math.sin(Date.now() * 0.003) * 2 : 0;

      if (coinRef.current) {
        coinRef.current.style.transform = `translate3d(${pos.current.x - 20}px, ${pos.current.y - 20 + bounce}px, 0) rotateY(${rotation.current}deg)`;
        coinRef.current.style.opacity = visible ? "1" : "0";
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [visible]);

  // Hidden on touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <div
      ref={coinRef}
      className="fixed top-0 left-0 z-50 pointer-events-none"
      style={{
        width: 40,
        height: 40,
        opacity: 0,
        transition: "opacity 0.3s",
        perspective: "600px",
        transformStyle: "preserve-3d",
        filter: "drop-shadow(0 4px 8px rgba(45, 106, 108, 0.35))",
      }}
    >
      <img
        src={PIXEL_COIN_SVG}
        alt=""
        width={40}
        height={40}
        style={{ imageRendering: "pixelated", display: "block" }}
        draggable={false}
      />
    </div>
  );
}

// --- Canvas Particle + Floating Shapes Animation ---

function useCanvasAnimation(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    // Floating orbs
    const orbs = [
      { x: 0.2, y: 0.3, radius: 120, color: "45, 130, 132", speed: 0.0008, phase: 0 },
      { x: 0.75, y: 0.6, radius: 80, color: "45, 160, 140", speed: 0.0012, phase: 2 },
      { x: 0.5, y: 0.8, radius: 100, color: "45, 130, 132", speed: 0.001, phase: 4 },
    ];

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      time++;

      // Draw orbs (glowing circles)
      for (const orb of orbs) {
        const ox = orb.x * w() + Math.sin(time * orb.speed * 3 + orb.phase) * 40;
        const oy = orb.y * h() + Math.cos(time * orb.speed * 2 + orb.phase) * 30;
        const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.radius);
        gradient.addColorStop(0, `rgba(${orb.color}, 0.08)`);
        gradient.addColorStop(0.5, `rgba(${orb.color}, 0.03)`);
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w();
        if (p.x > w()) p.x = 0;
        if (p.y < 0) p.y = h();
        if (p.y > h()) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 130, 132, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45, 130, 132, ${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Floating geometric shapes
      const shapes = [
        { x: 0.15, y: 0.25, size: 20, rotation: time * 0.01, type: "triangle" as const },
        { x: 0.85, y: 0.35, size: 15, rotation: -time * 0.008, type: "square" as const },
        { x: 0.7, y: 0.75, size: 18, rotation: time * 0.012, type: "triangle" as const },
        { x: 0.3, y: 0.7, size: 12, rotation: -time * 0.009, type: "diamond" as const },
      ];

      for (const shape of shapes) {
        const sx = shape.x * w() + Math.sin(time * 0.005 + shape.x * 10) * 20;
        const sy = shape.y * h() + Math.cos(time * 0.004 + shape.y * 10) * 15;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(shape.rotation);
        ctx.strokeStyle = "rgba(45, 130, 132, 0.15)";
        ctx.lineWidth = 1;

        if (shape.type === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -shape.size);
          ctx.lineTo(shape.size, shape.size);
          ctx.lineTo(-shape.size, shape.size);
          ctx.closePath();
          ctx.stroke();
        } else if (shape.type === "square") {
          ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -shape.size);
          ctx.lineTo(shape.size, 0);
          ctx.lineTo(0, shape.size);
          ctx.lineTo(-shape.size, 0);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);
}

// --- Feature Data ---

const FEATURES = [
  { icon: Brain, title: "Strict AI Advisor", desc: "AI that says NO when spending hurts your goals", color: "from-primary/20 to-primary/5" },
  { icon: Shield, title: "Privacy First", desc: "All data stored locally on your device. We never see it.", color: "from-accent/20 to-accent/5" },
  { icon: Target, title: "Goal Enforcement", desc: "Set budgets — AI enforces them ruthlessly", color: "from-primary/20 to-primary/5" },
  { icon: TrendingDown, title: "Impulse Control", desc: "Ask before you buy. AI checks if you can afford it", color: "from-accent/20 to-accent/5" },
  { icon: MessageSquare, title: "Chat to Log", desc: '"I spent ₹500 on groceries" — done', color: "from-primary/20 to-primary/5" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Know exactly where every rupee goes", color: "from-accent/20 to-accent/5" },
];

const STATS = [
  { value: "100%", label: "Private", sub: "Data stays on device" },
  { value: "₹0", label: "Cost", sub: "Free forever" },
  { value: "<2min", label: "Setup", sub: "Quick onboarding" },
];

// --- Main Component ---

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useCanvasAnimation(canvasRef);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <CoinFollower />
      {/* ===== HERO ===== */}
      <motion.div ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex flex-col">
        {/* Canvas Animation Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0"
          style={{ pointerEvents: "none" }}
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 z-[1]" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl gradient-primary flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M16 2 L28 7 C28 7 29 20 16 30 C3 20 4 7 4 7 Z" fill="white" opacity="0.9"/><polyline points="10,20 13.5,15.5 17,17.5 23,11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/><polygon points="21,9.5 24,9.5 24,12.5" fill="currentColor" className="text-primary"/></svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">PaisaBachao</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoaded && !isSignedIn && (
              <Button onClick={handleGoogleSignIn} size="sm" className="gradient-primary border-0 rounded-lg px-5">
                Get Started
              </Button>
            )}
            {isLoaded && isSignedIn && (
              <Button onClick={() => navigate("/dashboard")} size="sm" className="gradient-primary border-0 rounded-lg px-5">
                Dashboard
              </Button>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Privacy-first finance tracker
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Stop <span className="text-gradient">Overspending.</span>
                <br />
                Start <span className="text-gradient">Building Wealth.</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
                An AI finance advisor that won't sugarcoat it. Set goals, track every rupee, and get a strict YES or NO before every purchase.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <Button
                size="lg"
                className="gradient-primary border-0 rounded-xl px-8 h-12 text-sm font-medium shadow-lg shadow-primary/20"
                onClick={handleGoogleSignIn}
                disabled={!signInLoaded}
              >
                {!signInLoaded ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Sign in with Google
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> No data leaves your device
              </span>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex justify-center gap-8 md:gap-12 mt-16"
            >
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold font-mono text-gradient">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ===== MOCK DASHBOARD ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">How it looks</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Everything at a <span className="text-gradient">glance</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 md:p-8 shadow-2xl shadow-primary/5"
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
              <div className="flex-1 mx-4 h-6 rounded-md bg-secondary/50 flex items-center px-3">
                <span className="text-[10px] text-muted-foreground font-mono">paisabachao.in/dashboard</span>
              </div>
            </div>

            {/* Dashboard mock */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Total Balance</p>
                <p className="text-lg md:text-2xl font-bold font-mono text-primary">₹1,04,500</p>
                <p className="text-[10px] text-success mt-1">+12% this month</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-destructive/10 to-transparent border border-destructive/10 p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Expenses</p>
                <p className="text-lg md:text-2xl font-bold font-mono text-destructive">-₹23,680</p>
                <p className="text-[10px] text-muted-foreground mt-1">68% of budget used</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/10 p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Health Score</p>
                <p className="text-lg md:text-2xl font-bold font-mono text-accent">B+</p>
                <p className="text-[10px] text-muted-foreground mt-1">76/100 points</p>
              </div>
            </div>

            {/* Budget bars + recent transactions */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 space-y-3">
                <p className="text-xs font-medium">Budget Progress</p>
                {[
                  { name: "Groceries", pct: 72, color: "bg-primary" },
                  { name: "Dining", pct: 95, color: "bg-destructive" },
                  { name: "Transport", pct: 45, color: "bg-primary" },
                ].map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{b.name}</span><span>{b.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 space-y-2">
                <p className="text-xs font-medium">Recent</p>
                {[
                  { name: "Swiggy", amt: "-₹450", neg: true },
                  { name: "Salary", amt: "+₹75,000", neg: false },
                  { name: "Uber", amt: "-₹230", neg: true },
                ].map((t) => (
                  <div key={t.name} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-xs">{t.name}</span>
                    <span className={`text-xs font-mono font-medium ${t.neg ? "text-destructive" : "text-success"}`}>{t.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Features</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Built for <span className="text-gradient">discipline</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
              Not another pretty budget app. This one actually fights your impulses.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Simple</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Three steps to <span className="text-gradient">control</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: "01", title: "Sign in & set up", desc: "Connect with Google, add your accounts, set budgets. Under 2 minutes.", icon: Smartphone },
              { step: "02", title: "Track everything", desc: "Log transactions manually or just tell the AI. It handles the rest.", icon: MessageSquare },
              { step: "03", title: "Stay disciplined", desc: "Get alerts when you overspend. Ask AI before impulsive purchases.", icon: Shield },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex gap-5 items-start group"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="text-xs font-mono font-bold text-primary">{item.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M16 2 L28 7 C28 7 29 20 16 30 C3 20 4 7 4 7 Z" fill="white" opacity="0.9"/><polyline points="10,20 13.5,15.5 17,17.5 23,11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/><polygon points="21,9.5 24,9.5 24,12.5" fill="currentColor" className="text-primary"/></svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Ready to save smarter?
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Free forever. No credit card. Your data stays on your device.
          </p>
          <Button
            size="lg"
            className="gradient-primary border-0 rounded-xl px-8 h-12 text-sm font-medium shadow-lg shadow-primary/20"
            onClick={handleGoogleSignIn}
            disabled={!signInLoaded}
          >
            Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><path d="M16 2 L28 7 C28 7 29 20 16 30 C3 20 4 7 4 7 Z" fill="white" opacity="0.9"/></svg>
            </div>
            <span className="text-sm font-medium">PaisaBachao</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your data never leaves your device. Built with privacy at the core.
          </p>
        </div>
      </footer>
    </div>
  );
}
