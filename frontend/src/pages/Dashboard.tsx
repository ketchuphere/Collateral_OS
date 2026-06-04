import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetRiskDistribution,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import AIPortfolioSummary from "@/components/widgets/AIPortfolioSummary";
import { LiquidityGauge } from "@/components/widgets/LiquidityGauge";
import { RecoveryIntelligence } from "@/components/widgets/RecoveryIntelligence";
import { AIConfidenceWidget } from "@/components/widgets/AIConfidenceWidget";
import {
  formatINR,
  timeAgo,
  riskBadgeClass,
  cn,
} from "@/lib/utils";
import {
  Building2,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="stat-card flex items-start gap-3">
      <div className={cn("w-8 h-8 rounded flex items-center justify-center flex-shrink-0", accent ?? "bg-primary/10")}>
        <Icon className={cn("w-4 h-4", accent ? "text-white" : "text-primary")} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-xl font-semibold text-foreground font-mono">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function ActivityDot({ type }: { type: string }) {
  const color =
    type === "assessment_completed" ? "bg-primary" :
    type === "loan_approved" ? "bg-emerald-400" :
    type === "loan_rejected" ? "bg-red-400" :
    type === "alert_raised" ? "bg-orange-400" :
    type === "alert_resolved" ? "bg-emerald-400/60" :
    "bg-muted-foreground";
  return <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", color)} />;
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();
  const { data: riskDist } = useGetRiskDistribution();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI-Native Collateral Intelligence Infrastructure"
        subtitle="Valuation · Liquidity · Recovery · Fraud Intelligence"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* AI Executive Summary */}
        <AIPortfolioSummary />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loadingSummary ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="stat-card h-20 animate-pulse bg-muted" />
            ))
          ) : (
            <>
              <StatCard label="Total Properties" value={summary?.totalProperties ?? 0} icon={Building2} sub="Registered collateral" />
              <StatCard label="Active Loans" value={summary?.activeLoans ?? 0} icon={CreditCard} sub="Approved & disbursed" />
              <StatCard label="Portfolio Value" value={formatINR(summary?.totalPortfolioValue)} icon={TrendingUp} sub={`+${summary?.portfolioValueChange?.toFixed(1)}% this month`} accent="bg-primary/20" />
              <StatCard label="Open Alerts" value={summary?.openAlerts ?? 0} icon={ShieldAlert} sub="Unresolved fraud/risk" accent={summary?.openAlerts ? "bg-orange-500/20" : undefined} />
              <LiquidityGauge score={summary?.avgLiquidityScore} />
              <RecoveryIntelligence
                portfolioValue={summary?.totalPortfolioValue}
                avgLiquidityScore={summary?.avgLiquidityScore}
                avgConfidenceScore={summary?.avgConfidenceScore}
              />
              <AIConfidenceWidget
                avgConfidenceScore={summary?.avgConfidenceScore}
                avgLiquidityScore={summary?.avgLiquidityScore}
                openAlerts={summary?.openAlerts}
                totalProperties={summary?.totalProperties}
              />
              <StatCard label="Approved This Month" value={summary?.approvedLoansThisMonth ?? 0} icon={CreditCard} sub="Loan approvals" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk distribution */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-foreground mb-3">Risk Distribution</div>
            {riskDist && riskDist.length > 0 ? (
              <div className="space-y-2.5">
                {riskDist.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Badge className={riskBadgeClass(item.category)}>{item.category}</Badge>
                        <span className="text-muted-foreground">{item.count} properties</span>
                      </div>
                      <span className="font-mono text-foreground">{item.percentage}%</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className={cn(
                          "score-bar-fill",
                          item.category === "low" ? "bg-emerald-400" :
                          item.category === "moderate" ? "bg-amber-400" :
                          item.category === "high" ? "bg-orange-400" : "bg-red-400"
                        )}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{formatINR(item.totalValue)} total value</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No assessed properties yet</div>
            )}
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-foreground">Recent Activity</div>
              <Link href="/assessments" className="text-[10px] text-primary hover:underline">View all</Link>
            </div>
            {loadingActivity ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-0">
                {[...activity].reverse().slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 py-2 border-b border-border last:border-0">
                    <ActivityDot type={item.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground truncate">{item.description}</div>
                      <div className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No activity yet</div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/properties/new", label: "Register Collateral", desc: "Add new property", icon: Building2 },
            { href: "/assessments", label: "Assessment Queue", desc: "View AI reports", icon: ClipboardList },
            { href: "/loans/new", label: "New Loan Application", desc: "Submit for review", icon: CreditCard },
            { href: "/alerts", label: "Active Alerts", desc: "Resolve fraud flags", icon: AlertTriangle },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-card border border-border rounded-lg p-3 flex items-center gap-2.5 hover:border-primary/40 hover:bg-card transition-colors group"
            >
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</div>
                <div className="text-[10px] text-muted-foreground">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
