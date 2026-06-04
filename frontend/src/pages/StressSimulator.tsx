import { useState, useMemo } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatINR, cn } from "@/lib/utils";
import { Activity, RotateCcw, TrendingDown, Clock, Zap, AlertTriangle } from "lucide-react";

// ─── Stress model ──────────────────────────────────────────────────────────────
// Each driver maps a slider value to portfolio value delta (%) and recovery days delta
interface Driver {
  id: string;
  label: string;
  unit: string;
  direction: "up" | "down";     // which way the slider goes (interest rate UP, demand DOWN)
  min: number;
  max: number;
  step: number;
  default: number;
  valueImpactPerUnit: number;   // % change in portfolio value per 1 unit of this driver
  recoveryDaysPerUnit: number;  // extra recovery days per 1 unit
}

const DRIVERS: Driver[] = [
  {
    id: "rate",
    label: "Interest Rate",
    unit: "%",
    direction: "up",
    min: 0, max: 5, step: 0.5, default: 0,
    valueImpactPerUnit: -3.8,  // -3.8% portfolio value per +1% rate
    recoveryDaysPerUnit: 8,    // +8 days per +1% rate
  },
  {
    id: "demand",
    label: "Housing Demand",
    unit: "%",
    direction: "down",
    min: 0, max: 30, step: 5, default: 0,
    valueImpactPerUnit: -0.25, // -0.25% value per -1% demand
    recoveryDaysPerUnit: 1.2,
  },
  {
    id: "supply",
    label: "Local Supply",
    unit: "%",
    direction: "up",
    min: 0, max: 30, step: 5, default: 0,
    valueImpactPerUnit: -0.18,
    recoveryDaysPerUnit: 0.9,
  },
  {
    id: "gdp",
    label: "GDP Contraction",
    unit: "%",
    direction: "down",
    min: 0, max: 5, step: 0.5, default: 0,
    valueImpactPerUnit: -4.5,
    recoveryDaysPerUnit: 14,
  },
];

// Scenario presets
const PRESETS = [
  {
    id: "mild",
    label: "Mild Correction",
    color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10",
    values: { rate: 1, demand: 10, supply: 10, gdp: 0 },
  },
  {
    id: "moderate",
    label: "Moderate Stress",
    color: "text-amber-400 border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10",
    values: { rate: 2, demand: 15, supply: 20, gdp: 1 },
  },
  {
    id: "severe",
    label: "Severe Shock",
    color: "text-orange-400 border-orange-400/20 bg-orange-400/5 hover:bg-orange-400/10",
    values: { rate: 3, demand: 25, supply: 15, gdp: 2.5 },
  },
  {
    id: "crisis",
    label: "Crisis (2008-Level)",
    color: "text-red-400 border-red-400/20 bg-red-400/5 hover:bg-red-400/10",
    values: { rate: 4, demand: 30, supply: 5, gdp: 4.5 },
  },
];

type SliderValues = Record<string, number>;

function computeImpact(vals: SliderValues, baseValue: number, baseDays: number) {
  let valueDelta = 0;
  let daysDelta = 0;

  for (const d of DRIVERS) {
    const v = vals[d.id] ?? 0;
    valueDelta += v * d.valueImpactPerUnit;
    daysDelta += v * d.recoveryDaysPerUnit;
  }

  // Non-linear amplification when multiple shocks combine
  const combinedPressure = DRIVERS.reduce((sum, d) => sum + (vals[d.id] ?? 0) / d.max, 0) / DRIVERS.length;
  if (combinedPressure > 0.4) {
    valueDelta *= 1 + (combinedPressure - 0.4) * 0.6;
    daysDelta *= 1 + (combinedPressure - 0.4) * 0.5;
  }

  const stressedValue = baseValue * (1 + valueDelta / 100);
  const stressedDays = Math.round(baseDays + daysDelta);
  const valueDeltaINR = stressedValue - baseValue;

  const loanExposure = baseValue * 0.65;
  const stressedRecovery = stressedValue * 0.85;
  const coverageRatio = stressedRecovery / loanExposure;

  return {
    valuePct: valueDelta,
    stressedValue,
    valueDeltaINR,
    stressedDays,
    daysDelta: Math.round(daysDelta),
    coverageRatio,
    loanExposure,
    stressedRecovery,
  };
}

function severity(pct: number): { label: string; cls: string } {
  const abs = Math.abs(pct);
  if (abs < 3) return { label: "Negligible", cls: "text-emerald-400" };
  if (abs < 8) return { label: "Mild Impact", cls: "text-teal-400" };
  if (abs < 15) return { label: "Moderate Impact", cls: "text-amber-400" };
  if (abs < 25) return { label: "Severe Impact", cls: "text-orange-400" };
  return { label: "Critical Impact", cls: "text-red-400" };
}

function Slider({ driver, value, onChange }: { driver: Driver; value: number; onChange: (v: number) => void }) {
  const isActive = value > 0;
  const pct = (value / driver.max) * 100;
  const sign = driver.direction === "up" ? "+" : "−";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{driver.label}</span>
        <span className={cn(
          "text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
        )}>
          {isActive ? `${sign}${value}${driver.unit}` : "No stress"}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={driver.min}
          max={driver.max}
          step={driver.step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
          style={{
            background: isActive
              ? `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%)`
              : undefined,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>0{driver.unit}</span>
        <span>{driver.direction === "up" ? "+" : "−"}{driver.max}{driver.unit}</span>
      </div>
    </div>
  );
}

function ImpactBar({ pct }: { pct: number }) {
  const abs = Math.min(Math.abs(pct), 40);
  const color = abs < 3 ? "bg-emerald-400" : abs < 8 ? "bg-teal-400" : abs < 15 ? "bg-amber-400" : abs < 25 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <div className="absolute inset-y-0 left-1/2 w-px bg-border z-10" />
      <div
        className={cn("absolute inset-y-0 right-1/2 rounded-l-full transition-all duration-500", color)}
        style={{ width: `${(abs / 40) * 50}%` }}
      />
    </div>
  );
}

export default function StressSimulator() {
  const { data: summary } = useGetDashboardSummary();
  const baseValue = summary?.totalPortfolioValue ?? 150300000;
  const baseLiquidityScore = summary?.avgLiquidityScore ?? 63;
  const baseDays = baseLiquidityScore >= 80 ? 22 : baseLiquidityScore >= 65 ? 37 : baseLiquidityScore >= 50 ? 67 : baseLiquidityScore >= 35 ? 135 : 200;

  const [vals, setVals] = useState<SliderValues>(() =>
    Object.fromEntries(DRIVERS.map(d => [d.id, d.default]))
  );

  const set = (id: string) => (v: number) => setVals(prev => ({ ...prev, [id]: v }));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setVals({ ...vals, ...preset.values });
  };

  const reset = () => setVals(Object.fromEntries(DRIVERS.map(d => [d.id, d.default])));

  const isDefault = DRIVERS.every(d => (vals[d.id] ?? 0) === d.default);

  const impact = useMemo(
    () => computeImpact(vals, baseValue, baseDays),
    [vals, baseValue, baseDays]
  );

  const sev = severity(impact.valuePct);
  const coverageOk = impact.coverageRatio >= 1;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Market Stress Simulator"
        subtitle="Model adverse scenarios and measure portfolio resilience"
        action={
          <button
            onClick={reset}
            disabled={isDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-5xl">

          {/* ── Left panel: controls ──────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Presets */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                Quick Scenarios
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={cn("px-2 py-1.5 rounded border text-[10px] font-medium text-left transition-colors", p.color)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-5">
              <div className="text-xs font-medium text-foreground">Stress Drivers</div>
              {DRIVERS.map(d => (
                <Slider key={d.id} driver={d} value={vals[d.id] ?? 0} onChange={set(d.id)} />
              ))}
            </div>
          </div>

          {/* ── Right panel: output ───────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Severity banner */}
            <div className={cn(
              "rounded-lg border px-4 py-3 flex items-center gap-3",
              isDefault
                ? "border-border bg-card"
                : Math.abs(impact.valuePct) >= 15
                ? "border-orange-400/30 bg-orange-400/5"
                : Math.abs(impact.valuePct) >= 8
                ? "border-amber-400/30 bg-amber-400/5"
                : "border-primary/20 bg-primary/5"
            )}>
              <Activity className={cn("w-4 h-4 flex-shrink-0", isDefault ? "text-muted-foreground" : sev.cls)} />
              <div>
                <div className={cn("text-sm font-semibold", isDefault ? "text-muted-foreground" : sev.cls)}>
                  {isDefault ? "No stress applied — baseline portfolio" : sev.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {isDefault ? "Adjust sliders or pick a scenario above" : "Stress-tested against active portfolio data"}
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Portfolio Value Impact */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Portfolio Value Impact</div>
                <div className={cn("text-3xl font-semibold font-mono", isDefault ? "text-foreground" : sev.cls)}>
                  {isDefault ? "0.0%" : `${impact.valuePct.toFixed(1)}%`}
                </div>
                <ImpactBar pct={impact.valuePct} />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baseline</span>
                    <span className="font-mono text-foreground">{formatINR(baseValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stressed</span>
                    <span className={cn("font-mono font-medium", isDefault ? "text-foreground" : impact.valuePct < 0 ? "text-red-400" : "text-emerald-400")}>
                      {formatINR(impact.stressedValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loss</span>
                    <span className="font-mono text-red-400">
                      {isDefault ? "—" : formatINR(Math.abs(impact.valueDeltaINR))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recovery Time */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Recovery Time</div>
                <div className="flex items-end gap-1.5 font-mono leading-none">
                  <span className={cn("text-3xl font-semibold", isDefault ? "text-foreground" : "text-foreground")}>
                    {impact.stressedDays}
                  </span>
                  <span className="text-base text-muted-foreground mb-0.5">days</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      impact.stressedDays > 180 ? "bg-red-400" :
                      impact.stressedDays > 120 ? "bg-orange-400" :
                      impact.stressedDays > 60 ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    style={{ width: `${Math.min(100, (impact.stressedDays / 200) * 100)}%` }}
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baseline</span>
                    <span className="font-mono text-foreground">{baseDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delta</span>
                    <span className={cn("font-mono font-medium", impact.daysDelta > 0 ? "text-red-400" : "text-muted-foreground")}>
                      {impact.daysDelta > 0 ? `+${impact.daysDelta}` : "—"} days
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {impact.stressedDays <= 30 ? "Fast liquidation" : impact.stressedDays <= 90 ? "Normal market exit" : impact.stressedDays <= 180 ? "Extended holding period" : "Distressed liquidation zone"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Coverage Ratio */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Loan-to-Collateral Coverage</div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  coverageOk ? "border-emerald-400" : "border-red-400"
                )}>
                  <span className={cn("text-sm font-semibold font-mono", coverageOk ? "text-emerald-400" : "text-red-400")}>
                    {impact.coverageRatio.toFixed(2)}x
                  </span>
                </div>
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Exposure (est. 65% LTV)</span>
                    <span className="font-mono text-foreground">{formatINR(impact.loanExposure)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stressed Recovery (85% haircut)</span>
                    <span className={cn("font-mono", coverageOk ? "text-emerald-400" : "text-red-400")}>{formatINR(impact.stressedRecovery)}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-medium",
                    coverageOk
                      ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-400"
                      : "border-red-400/20 bg-red-400/5 text-red-400"
                  )}>
                    {coverageOk
                      ? "✓ Recovery sufficient to cover loan exposure"
                      : "⚠ Recovery insufficient — loan book at risk"}
                  </div>
                </div>
              </div>
            </div>

            {/* Per-driver breakdown */}
            {!isDefault && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="text-xs font-medium text-foreground">Scenario Breakdown</div>
                <div className="space-y-2">
                  {DRIVERS.filter(d => (vals[d.id] ?? 0) > 0).map(d => {
                    const v = vals[d.id] ?? 0;
                    const dPct = v * d.valueImpactPerUnit;
                    const dDays = Math.round(v * d.recoveryDaysPerUnit);
                    const sign = d.direction === "up" ? "+" : "−";
                    return (
                      <div key={d.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border last:border-0">
                        <div className="w-32 flex-shrink-0">
                          <span className="text-foreground font-medium">{d.label}</span>
                          <span className="text-muted-foreground ml-1">{sign}{v}{d.unit}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <span className="font-mono text-red-400 w-14 text-right">{dPct.toFixed(1)}%</span>
                          <span className="text-muted-foreground">value</span>
                          <span className="font-mono text-orange-400 w-12 text-right">+{dDays}d</span>
                          <span className="text-muted-foreground">recovery</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {DRIVERS.filter(d => (vals[d.id] ?? 0) > 0).length >= 2 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70">
                    <AlertTriangle className="w-3 h-3" />
                    Combined shock amplification applied — correlated stresses compound non-linearly
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
