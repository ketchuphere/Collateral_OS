import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { MailCheck, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs.current[5]?.focus();
    }
  };

  const code = digits.join("");

  const handleVerify = () => {
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      setTimeout(() => navigate("/"), 2000);
    }, 1200);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setResent(true);
    setCooldown(30);
    setDigits(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
    setTimeout(() => setResent(false), 3000);
  };

  if (verified) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Email verified!</h2>
            <p className="text-xs text-muted-foreground mt-1">Redirecting to your dashboard…</p>
          </div>
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Verify Your Email</h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Enter the 6-digit code sent to
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5">user@company.com</p>
          </div>
        </div>

        {/* OTP inputs */}
        <div
          className="flex items-center justify-center gap-2.5"
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={cn(
                "w-11 h-13 text-center text-xl font-bold font-mono bg-card border rounded-lg focus:outline-none transition-colors",
                "h-12",
                d ? "border-primary text-foreground" : "border-border text-foreground",
                error ? "border-red-400/60" : "focus:border-primary/60"
              )}
            />
          ))}
        </div>

        {/* Error */}
        {error && <p className="text-center text-[11px] text-red-400">{error}</p>}

        {/* Resent notice */}
        {resent && (
          <p className="text-center text-[11px] text-emerald-400">Code resent — check your inbox.</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.length < 6}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Verifying…</>
            : "Verify Email"}
        </button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                cooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
              )}
            >
              <RefreshCw className="w-3 h-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </p>
        </div>

        {/* Back */}
        <p className="text-center text-xs text-muted-foreground">
          Wrong email?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary hover:underline">
            Go back
          </button>
        </p>
      </div>
    </div>
  );
}
