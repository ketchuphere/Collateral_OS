import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";

interface Driver {
  label: string;
  positive: boolean;
}

function deriveDrivers(
  avgLiquidity: number,
  avgConfidence: number,
  openAlerts: number,
  totalProperties: number,
): Driver[] {
  const positive: Driver[] = [];
  const negative: Driver[] = [];

  // Positive signals
  if (avgLiquidity >= 60)    positive.push({ label: "Metro proximity", positive: true });
  if (avgConfidence >= 70)   positive.push({ label: "Rental demand", positive: true });
  if (avgLiquidity >= 65)    positive.push({ label: "High absorption rate", positive: true });
  if (totalProperties >= 5)  positive.push({ label: "Portfolio diversification", positive: true });
  if (avgConfidence >= 75)   positive.push({ label: "Appraisal consensus", positive: true });

  // Negative signals
  if (openAlerts > 0)        negative.push({ label: "Active fraud signals", positive: false });
  if (avgLiquidity < 65)     negative.push({ label: "Oversupply risk", positive: false });
  if (avgConfidence < 75)    negative.push({ label: "Aging inventory", positive: false });
  if (avgLiquidity < 55)     negative.push({ label: "Weak absorption velocity", positive: false });

  // Return top 2 positive + top 2 negative
  return [...positive.slice(0, 2), ...negative.slice(0, 2)];
}

function arcPath(pct: number, r = 28) {
  // 270-degree arc from 135° to 45° (clockwise bottom-left to bottom-right)
  const startAngle = 135 * (Math.PI / 180);
  const sweep = 270 * (Math.PI / 180);
  const endAngle = startAngle + sweep * Math.min(1, pct / 100);
  const cx = 32, cy = 32;

  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const largeArc = sweep * (pct / 100) > Math.PI ? 1 : 0;

  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

function scoreColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 65) return "#14b8a6";
  if (pct >= 50) return "#f59e0b";
  return "#f97316";
}

export function AIConfidenceWidget({
  avgConfidenceScore,
  avgLiquidityScore,
  openAlerts,
  totalProperties,
}: {
  avgConfidenceScore: number | null | undefined;
  avgLiquidityScore: number | null | undefined;
  openAlerts: number | null | undefined;
  totalProperties: number | null | undefined;
}) {
  const conf  = avgConfidenceScore ?? 0;
  const liq   = avgLiquidityScore ?? 0;
  const alerts = openAlerts ?? 0;
  const props = totalProperties ?? 0;

  const drivers = deriveDrivers(liq, conf, alerts, props);
  const color   = scoreColor(conf);

  return (
    <div className="stat-card flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">AI Confidence</span>
      </div>

      {/* Arc gauge + score */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <svg width="64" height="48" viewBox="0 0 64 48">
            {/* Track */}
            <path
              d={arcPath(100)}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Fill */}
            <path
              d={arcPath(conf)}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pb-1">
            <span className="text-sm font-bold font-mono text-foreground">{conf}%</span>
          </div>
        </div>

        {/* Drivers */}
        <div className="flex-1 space-y-0.5 min-w-0">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Top Drivers</div>
          {drivers.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              {d.positive
                ? <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                : <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />}
              <span className={d.positive ? "text-foreground/80" : "text-foreground/60"}>{d.label}</span>
            </div>
          ))}
          {drivers.length === 0 && (
            <div className="text-[10px] text-muted-foreground">Add assessments to see drivers</div>
          )}
        </div>
      </div>
    </div>
  );
}
