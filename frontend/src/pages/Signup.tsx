import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PERKS = [
  "Full AI assessment suite — no setup required",
  "Live fraud intelligence across your portfolio",
  "Recovery & liquidity modelling from day one",
  "Dedicated onboarding for enterprise teams",
];

export default function Signup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", org: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())      errs.name = "Required";
    if (!form.email.includes("@")) errs.email = "Enter a valid email";
    if (!form.org.trim())       errs.org = "Required";
    if (form.password.length < 8) errs.password = "Minimum 8 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/verify-email"); }, 1000);
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-teal-400", "bg-emerald-400"][strength];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[40%] flex-col bg-gradient-to-br from-primary/10 via-background to-background border-r border-border px-12 py-10">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-foreground">CollateralOS</span>
        </div>

        <div className="my-auto space-y-6">
          <div>
            <div className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Enterprise Access</div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Built for credit teams that move fast
            </h1>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs">
              CollateralOS gives your underwriters AI-native collateral analysis from day one — no integrations, no delay.
            </p>
          </div>
          <div className="space-y-2.5">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-foreground/70">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40">
          Enterprise-grade collateral intelligence platform · Trusted by lenders and risk teams
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">Request access</h2>
            <p className="text-xs text-muted-foreground mt-1">Set up your organisation's account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <Field label="Full Name" error={errors.name}>
              <input
                type="text" value={form.name} onChange={set("name")}
                placeholder="Ananya Sharma"
                className={inputCls(!!errors.name)}
              />
            </Field>

            {/* Work Email */}
            <Field label="Work Email" error={errors.email}>
              <input
                type="email" value={form.email} onChange={set("email")}
                placeholder="you@yourbank.com"
                className={inputCls(!!errors.email)}
              />
            </Field>

            {/* Organisation */}
            <Field label="Organisation" error={errors.org}>
              <input
                type="text" value={form.org} onChange={set("org")}
                placeholder="HDFC Bank / Bajaj Finance / ICICI…"
                className={inputCls(!!errors.org)}
              />
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="Min. 8 characters"
                  className={inputCls(!!errors.password) + " pr-10"}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-0.5 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
                        strength >= i ? strengthColor : "bg-muted")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{strengthLabel}</span>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirm}>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"} value={form.confirm} onChange={set("confirm")}
                  placeholder="Repeat password"
                  className={inputCls(!!errors.confirm) + " pr-10"}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              By creating an account you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{" "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Creating account…</>
                : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-3 py-2.5 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors",
    hasError ? "border-red-400/60 focus:border-red-400" : "border-border focus:border-primary/60"
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
