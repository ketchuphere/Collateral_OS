import { cn } from "@/lib/utils";
import { Droplets } from "lucide-react";

interface LiquidityProfile {
  label: string;
  colorBar: string;
  colorText: string;
  colorBg: string;
  days: string;
}

function getProfile(score: number): LiquidityProfile {
  if (score >= 80) return {
    label: "Low Recovery Risk",
    colorBar: "bg-emerald-400",
    colorText: "text-emerald-400",
    colorBg: "bg-emerald-400/10 border-emerald-400/20",
    days: "15–30 days",
  };
  if (score >= 65) return {
    label: "Low-Moderate Recovery Risk",
    colorBar: "bg-teal-400",
    colorText: "text-teal-400",
    colorBg: "bg-teal-400/10 border-teal-400/20",
    days: "30–45 days",
  };
  if (score >= 50) return {
    label: "Moderate Recovery Risk",
    colorBar: "bg-amber-400",
    colorText: "text-amber-400",
    colorBg: "bg-amber-400/10 border-amber-400/20",
    days: "45–90 days",
  };
  if (score >= 35) return {
    label: "High Recovery Risk",
    colorBar: "bg-orange-400",
    colorText: "text-orange-400",
    colorBg: "bg-orange-400/10 border-orange-400/20",
    days: "90–180 days",
  };
  return {
    label: "Critical Recovery Risk",
    colorBar: "bg-red-400",
    colorText: "text-red-400",
    colorBg: "bg-red-400/10 border-red-400/20",
    days: "180+ days",
  };
}

export function LiquidityGauge({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  const profile = getProfile(s);
  const pct = Math.min(100, Math.max(0, s));

  return (
    <div className="stat-card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Portfolio Liquidity</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-end gap-1 leading-none">
        <span className="text-3xl font-semibold font-mono text-foreground">{score != null ? s : "—"}</span>
        <span className="text-base text-muted-foreground font-mono mb-0.5">/ 100</span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", profile.colorBar)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Risk label */}
      <span className={cn(
        "self-start text-[10px] font-medium px-2 py-0.5 rounded border",
        profile.colorBg, profile.colorText
      )}>
        {profile.label}
      </span>

      {/* Liquidation time */}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-[10px] text-muted-foreground">Expected Liquidation</span>
        <span className="text-[11px] font-mono font-semibold text-foreground">{profile.days}</span>
      </div>
    </div>
  );
}
