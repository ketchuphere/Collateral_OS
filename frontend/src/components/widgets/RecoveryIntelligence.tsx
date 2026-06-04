import { cn } from "@/lib/utils";
import { ShieldCheck, Clock } from "lucide-react";

function daysFromLiquidity(score: number) {
  if (score >= 80) return { range: "15–30 days", mid: 22 };
  if (score >= 65) return { range: "30–45 days", mid: 37 };
  if (score >= 50) return { range: "45–90 days", mid: 67 };
  if (score >= 35) return { range: "90–180 days", mid: 135 };
  return { range: "180+ days", mid: 200 };
}

function confidenceStyle(pct: number) {
  if (pct >= 80) return { bar: "bg-emerald-400", text: "text-emerald-400", badge: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400", label: "High Confidence" };
  if (pct >= 65) return { bar: "bg-teal-400",    text: "text-teal-400",    badge: "bg-teal-400/10 border-teal-400/20 text-teal-400",       label: "Good Confidence" };
  if (pct >= 50) return { bar: "bg-amber-400",   text: "text-amber-400",   badge: "bg-amber-400/10 border-amber-400/20 text-amber-400",     label: "Moderate Confidence" };
  return           { bar: "bg-orange-400",  text: "text-orange-400",  badge: "bg-orange-400/10 border-orange-400/20 text-orange-400",   label: "Low Confidence" };
}

function formatCr(value: number) {
  const cr = value / 1e7;
  return `₹${cr.toFixed(2)} Cr`;
}

export function RecoveryIntelligence({
  portfolioValue,
  avgLiquidityScore,
  avgConfidenceScore,
}: {
  portfolioValue: number | null | undefined;
  avgLiquidityScore: number | null | undefined;
  avgConfidenceScore: number | null | undefined;
}) {
  const base  = portfolioValue ?? 0;
  const liq   = avgLiquidityScore ?? 60;
  const conf  = avgConfidenceScore ?? 70;

  // Recovery value: apply 85% haircut weighted by confidence
  const recoveryValue = base * 0.85 * (conf / 100);
  const recoveryPct   = base > 0 ? Math.round((recoveryValue / base) * 100) : 0;
  const { range: daysRange } = daysFromLiquidity(liq);
  const style = confidenceStyle(conf);

  return (
    <div className="stat-card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Recovery Value</span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5 leading-none">
        <span className="text-3xl font-semibold font-mono text-foreground">
          {base > 0 ? formatCr(recoveryValue) : "—"}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", style.bar)}
            style={{ width: `${conf}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", style.badge)}>
            {conf}% Recovery Confidence
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">{recoveryPct}% of value</span>
        </div>
      </div>

      {/* Recovery timeline */}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Expected Recovery
        </div>
        <span className="text-[11px] font-mono font-semibold text-foreground">{daysRange}</span>
      </div>
    </div>
  );
}
