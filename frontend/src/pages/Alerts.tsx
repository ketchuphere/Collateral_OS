import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useListAlerts, useResolveAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import { timeAgo, severityBadgeClass, cn } from "@/lib/utils";
import {
  ShieldAlert, CheckCircle, MapPin, Ruler, TrendingUp,
  Image, AlertTriangle, Shield, CheckSquare,
} from "lucide-react";

// ─── Alert type maps ────────────────────────────────────────────────────────
const ALERT_TYPE_LABELS: Record<string, string> = {
  inflated_valuation: "Inflated Valuation",
  fake_size: "Fake Area/Size",
  location_mismatch: "Location Mismatch",
  suspicious_pricing: "Suspicious Pricing",
  abnormal_config: "Abnormal Configuration",
  image_inconsistency: "Image Inconsistency",
};

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const SEV_ORDER = ["critical", "high", "medium", "low"];

// ─── Intelligence signal config ─────────────────────────────────────────────
interface SignalConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchTypes: string[];          // alert types that trigger this signal
  isPass?: boolean;              // if true, uses PASSED/FAILED instead of LOW/HIGH
  passLabel?: string;
  failLabel?: string;
  descriptions: Record<string, string>;
}

const SIGNALS: SignalConfig[] = [
  {
    id: "location",
    label: "Location Mismatch Risk",
    icon: MapPin,
    matchTypes: ["location_mismatch"],
    descriptions: {
      none: "Registered address, GPS coordinates, and ownership records are consistent.",
      low: "Minor coordinate offset detected — within acceptable error range.",
      medium: "Significant mismatch between registered location and GPS data.",
      high: "Registered address does not match pincode zone. Possible misrepresentation.",
      critical: "Address and coordinates are in different cities. Likely fraudulent registration.",
    },
  },
  {
    id: "size",
    label: "Size Anomaly Risk",
    icon: Ruler,
    matchTypes: ["fake_size", "abnormal_config"],
    descriptions: {
      none: "Declared carpet area and built-up area ratios are within normal range.",
      low: "Minor discrepancy in BUA/carpet ratio — common in older constructions.",
      medium: "Declared area is 15–25% above comparable properties in the micro-market.",
      high: "Area claim is more than 30% above market comparables — likely inflated.",
      critical: "Declared area is physically impossible for the stated plot dimensions.",
    },
  },
  {
    id: "valuation",
    label: "Valuation Inflation Risk",
    icon: TrendingUp,
    matchTypes: ["inflated_valuation", "suspicious_pricing"],
    descriptions: {
      none: "Market value estimate aligns with comparable transactions in the micro-market.",
      low: "Valuation is 5–10% above comparables — within acceptable band.",
      medium: "Valuation is 15–25% above recent comparable transactions.",
      high: "Valuation is 28–35% above comparables. Possible appraisal manipulation.",
      critical: "Valuation is more than 40% above market. Strong indication of fraud.",
    },
  },
  {
    id: "image",
    label: "Image Authenticity",
    icon: Image,
    matchTypes: ["image_inconsistency"],
    isPass: true,
    passLabel: "PASSED",
    failLabel: "FAILED",
    descriptions: {
      none: "EXIF metadata, location tags, and visual consistency checks passed.",
      low: "Minor metadata inconsistency — may be due to photo editing apps.",
      medium: "Image metadata location does not match registered property address.",
      high: "Photos appear to be from a different property or are digitally manipulated.",
      critical: "Images are duplicates from other listings — fabricated collateral evidence.",
    },
  },
];

// ─── Derive signal level ─────────────────────────────────────────────────────
type AlertRow = {
  id: number; alertType: string; severity: string; resolved: boolean;
  message: string; propertyId: number; assessmentId?: number | null;
  details?: string | null; createdAt: string; resolvedAt?: string | null;
};

function deriveSignal(alerts: AlertRow[], signal: SignalConfig) {
  const matched = alerts.filter(
    a => !a.resolved && signal.matchTypes.includes(a.alertType)
  );
  if (matched.length === 0) return { level: "none", count: 0 };
  const top = matched.sort(
    (a, b) => (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0)
  )[0];
  return { level: top.severity, count: matched.length };
}

// ─── Styling helpers ─────────────────────────────────────────────────────────
function riskStyle(level: string, isPass?: boolean) {
  if (isPass) {
    return level === "none"
      ? { badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20", dot: "bg-emerald-400", ring: "border-emerald-400/20" }
      : { badge: "bg-red-400/10 text-red-400 border border-red-400/20", dot: "bg-red-400", ring: "border-red-400/20" };
  }
  switch (level) {
    case "critical": return { badge: "bg-red-400/10 text-red-400 border border-red-400/20", dot: "bg-red-400", ring: "border-red-400/20" };
    case "high":     return { badge: "bg-orange-400/10 text-orange-400 border border-orange-400/20", dot: "bg-orange-400", ring: "border-orange-400/20" };
    case "medium":   return { badge: "bg-amber-400/10 text-amber-400 border border-amber-400/20", dot: "bg-amber-400", ring: "border-amber-400/20" };
    case "low":      return { badge: "bg-teal-400/10 text-teal-400 border border-teal-400/20", dot: "bg-teal-400", ring: "border-teal-400/20" };
    default:         return { badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20", dot: "bg-emerald-400", ring: "border-emerald-400/20" };
  }
}

function riskLabel(level: string, signal: SignalConfig): string {
  if (signal.isPass) return level === "none" ? (signal.passLabel ?? "PASSED") : (signal.failLabel ?? "FAILED");
  return level === "none" ? "CLEAR" : level.toUpperCase();
}

// ─── Signal Card ─────────────────────────────────────────────────────────────
function SignalCard({ signal, alerts }: { signal: SignalConfig; alerts: AlertRow[] }) {
  const { level, count } = deriveSignal(alerts, signal);
  const style = riskStyle(level, signal.isPass);
  const label = riskLabel(level, signal);
  const description = signal.descriptions[level] ?? signal.descriptions.none;
  const Icon = signal.icon;
  const isAlert = level !== "none";

  return (
    <div className={cn(
      "bg-card border rounded-lg p-4 space-y-3 transition-colors",
      isAlert ? style.ring : "border-border"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
            isAlert ? "bg-foreground/5" : "bg-emerald-400/10"
          )}>
            <Icon className={cn("w-3.5 h-3.5", isAlert ? (level === "high" || level === "critical" ? "text-red-400" : level === "medium" ? "text-amber-400" : "text-teal-400") : "text-emerald-400")} />
          </div>
          <span className="text-xs font-medium text-foreground">{signal.label}</span>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex-shrink-0", style.badge)}>
          {label}
        </span>
      </div>

      {/* Status indicator bar */}
      <div className="flex gap-1">
        {SEV_ORDER.map((s) => (
          <div key={s} className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            signal.isPass
              ? isAlert ? "bg-red-400" : s === "low" ? "bg-emerald-400" : "bg-muted"
              : (SEV_RANK[level] ?? 0) >= (SEV_RANK[s] ?? 0) && level !== "none"
                ? riskStyle(level).dot.replace("bg-", "bg-")
                : "bg-muted"
          )} />
        ))}
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>

      {/* Count badge if alerts exist */}
      {count > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertTriangle className="w-3 h-3" />
          {count} active {count === 1 ? "alert" : "alerts"} contributing to this signal
        </div>
      )}

      {/* Pass indicator */}
      {!isAlert && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          {signal.isPass ? <CheckSquare className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          {signal.isPass ? "All image checks passed" : "No anomalies detected"}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Alerts() {
  const [showResolved, setShowResolved] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("");
  const queryClient = useQueryClient();

  // Fetch ALL alerts (for intelligence signals — always unresolved)
  const { data: allAlerts } = useListAlerts(
    { resolved: false },
    { query: { refetchInterval: 10_000 } }
  );

  // Fetch filtered alerts for the feed
  const { data: alerts, isLoading } = useListAlerts(
    { resolved: showResolved, severity: severityFilter || undefined },
    { query: { refetchInterval: 5000 } }
  );

  const resolveAlert = useResolveAlert();

  const handleResolve = async (id: number) => {
    await resolveAlert.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
  };

  const activeCount = allAlerts?.length ?? 0;
  const highCount = (allAlerts ?? []).filter(a => a.severity === "high" || a.severity === "critical").length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Fraud Intelligence Center"
        subtitle={activeCount > 0 ? `${activeCount} active signals · ${highCount} high severity` : "No active fraud signals"}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Intelligence Signals ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Fraud Intelligence</span>
            <span className="text-[10px] text-muted-foreground">· Derived from AI analysis of portfolio-wide alerts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {SIGNALS.map(sig => (
              <SignalCard key={sig.id} signal={sig} alerts={(allAlerts ?? []) as AlertRow[]} />
            ))}
          </div>
        </div>

        {/* ── Alert Feed ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Alert Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-2.5 py-1.5 text-xs bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowResolved(!showResolved)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border transition-colors",
                  showResolved
                    ? "bg-muted text-foreground border-border"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                {showResolved ? "Showing Resolved" : "Show Resolved"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : alerts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="w-10 h-10 text-muted-foreground mb-3" />
              <div className="text-sm text-foreground">No alerts found</div>
              <div className="text-xs text-muted-foreground mt-1">
                {showResolved ? "No resolved alerts." : "All clear — no active fraud or risk alerts."}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[...(alerts ?? [])].sort((a, b) =>
                (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0)
              ).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "bg-card border rounded-lg p-4",
                    alert.resolved
                      ? "border-border opacity-60"
                      : alert.severity === "critical" ? "border-red-400/30"
                      : alert.severity === "high" ? "border-orange-400/30"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={severityBadgeClass(alert.severity)}>{alert.severity}</Badge>
                        <span className="text-xs font-medium text-foreground">{alert.message}</span>
                        {alert.resolved && (
                          <Badge className="bg-muted text-muted-foreground border border-border">Resolved</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="bg-muted/30 px-1.5 py-0.5 rounded">
                          {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                        </span>
                        <Link href={`/properties/${alert.propertyId}`} className="text-primary hover:underline">
                          Property #{alert.propertyId}
                        </Link>
                        {alert.assessmentId && (
                          <Link href={`/assessments/${alert.assessmentId}`} className="text-primary hover:underline">
                            Assessment #{alert.assessmentId}
                          </Link>
                        )}
                        <span>{timeAgo(alert.createdAt)}</span>
                      </div>
                      {alert.details && (
                        <p className="text-[11px] text-foreground/70 leading-relaxed bg-muted/20 rounded px-3 py-2 mt-2">
                          {alert.details}
                        </p>
                      )}
                      {alert.resolved && alert.resolvedAt && (
                        <div className="text-[10px] text-muted-foreground">Resolved {timeAgo(alert.resolvedAt)}</div>
                      )}
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolveAlert.isPending}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] rounded border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
