import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Mail, KeyRound, Lock, CheckCircle, ArrowLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "newpass" | "success";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS: Array<{ id: Step; label: string }> = [
  { id: "email",   label: "Email" },
  { id: "otp",     label: "Verify" },
  { id: "newpass", label: "New Password" },
  { id: "success", label: "Done" },
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-0 w-full mb-8">
      {STEPS.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const future  = i > idx;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors",
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "bg-primary/10 border-primary text-primary" :
                         "bg-transparent border-border text-muted-foreground"
              )}>
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] font-medium whitespace-nowrap",
                active ? "text-primary" : done ? "text-foreground/60" : "text-muted-foreground"
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-1 mb-3.5", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────
function inputCls(err?: boolean) {
  return cn(
    "w-full px-3 py-2.5 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors",
    err ? "border-red-400/60" : "border-border focus:border-primary/60"
  );
}

// ─── Step: Email ─────────────────────────────────────────────────────────────
function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onNext(email); }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Forgot your password?</h2>
        <p className="text-xs text-muted-foreground">Enter your work email and we'll send a reset code.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Work Email</label>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="you@yourbank.com" className={inputCls(!!error)} />
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Sending code…</>
            : "Send Reset Code"}
        </button>
      </form>
    </div>
  );
}

// ─── Step: OTP ───────────────────────────────────────────────────────────────
function OtpStep({ email, onNext }: { email: string; onNext: () => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next); setError("");
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setDigits(p.split("")); refs.current[5]?.focus(); }
  };

  const code = digits.join("");
  const submit = () => {
    if (code.length < 6) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext(); }, 900);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Check your inbox</h2>
        <p className="text-xs text-muted-foreground">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            className={cn(
              "w-11 h-12 text-center text-xl font-bold font-mono bg-card border rounded-lg focus:outline-none transition-colors",
              d ? "border-primary text-foreground" : "border-border",
              error && "border-red-400/60"
            )}
          />
        ))}
      </div>

      {error && <p className="text-center text-[10px] text-red-400">{error}</p>}

      <button onClick={submit} disabled={loading || code.length < 6}
        className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Verifying…</>
          : "Verify Code"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        <button onClick={() => setCooldown(30)} disabled={cooldown > 0}
          className={cn("inline-flex items-center gap-1", cooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline")}>
          <RefreshCw className="w-3 h-3" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </p>
    </div>
  );
}

// ─── Step: New Password ───────────────────────────────────────────────────────
function NewPasswordStep({ onNext }: { onNext: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-teal-400", "bg-emerald-400"][strength];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (password.length < 8) errs.password = "Minimum 8 characters";
    if (password !== confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    setTimeout(() => { setLoading(false); onNext(); }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Set a new password</h2>
        <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">New Password</label>
          <div className="relative">
            <input type={showP ? "text" : "password"} value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
              placeholder="New password" className={inputCls(!!errors.password) + " pr-10"} />
            <button type="button" onClick={() => setShowP(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5 flex-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
                    strength >= i ? strengthColor : "bg-muted")} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{strengthLabel}</span>
            </div>
          )}
          {errors.password && <p className="text-[10px] text-red-400">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Confirm Password</label>
          <div className="relative">
            <input type={showC ? "text" : "password"} value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
              placeholder="Repeat password" className={inputCls(!!errors.confirm) + " pr-10"} />
            <button type="button" onClick={() => setShowC(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm && <p className="text-[10px] text-red-400">{errors.confirm}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Updating…</>
            : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

// ─── Step: Success ────────────────────────────────────────────────────────────
function SuccessStep({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Password reset!</h2>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Your password has been updated successfully.<br />You can now sign in with your new credentials.
        </p>
      </div>
      <button onClick={onLogin}
        className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
        Back to Sign In
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  return (
    <div className="flex h-screen bg-background items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Back to login */}
        {step !== "success" && (
          <button onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </button>
        )}

        <StepBar current={step} />

        {step === "email"   && <EmailStep onNext={e => { setEmail(e); setStep("otp"); }} />}
        {step === "otp"     && <OtpStep email={email} onNext={() => setStep("newpass")} />}
        {step === "newpass" && <NewPasswordStep onNext={() => setStep("success")} />}
        {step === "success" && <SuccessStep onLogin={() => navigate("/login")} />}
      </div>
    </div>
  );
}
