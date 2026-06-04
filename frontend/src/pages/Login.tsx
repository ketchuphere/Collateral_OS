import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Zap, MapPin, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: TrendingUp, text: "AI-powered collateral valuation & recovery intelligence" },
  { icon: Shield,    text: "Real-time fraud detection across your loan portfolio" },
  { icon: Zap,       text: "Instant LTV recommendations with explainable AI" },
  { icon: MapPin,    text: "Geographic risk heatmaps across every micro-market" },
];

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/"); }, 1200);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-gradient-to-br from-primary/10 via-background to-background border-r border-border px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">CollateralOS</span>
        </div>

        {/* Hero */}
        <div className="my-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
              AI-Native Collateral<br />Intelligence Infrastructure
            </h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm">
              The decision-support platform trusted by credit analysts and risk teams for secured lending across India.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs text-foreground/70 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer badges */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-foreground/60">Enterprise-grade collateral intelligence platform</p>
          <p className="text-[10px] text-muted-foreground/50">Trusted by lenders and risk teams · SOC 2 compliant · Bank-grade encryption</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-foreground">CollateralOS</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Sign in</h2>
            <p className="text-xs text-muted-foreground mt-1">Access your collateral intelligence dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourbank.com"
                className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[11px] text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-[11px] text-red-400">{error}</p>}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Signing in…</>
              ) : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full py-2.5 bg-card border border-border text-sm text-foreground rounded-lg hover:border-primary/40 hover:bg-muted/30 transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">
              Request access
            </button>
          </p>
        </div>

        {/* Bottom footer */}
        <div className="absolute bottom-6 text-center">
          <p className="text-[10px] text-muted-foreground/40">Enterprise-grade collateral intelligence platform · Trusted by lenders and risk teams</p>
        </div>
      </div>
    </div>
  );
}
