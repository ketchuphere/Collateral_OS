import { useState } from "react";
import { Link } from "wouter";
import { useListAssessments } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import {
  formatINR,
  formatDate,
  riskBadgeClass,
  statusBadgeClass,
  scoreColor,
  cn,
} from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export default function Assessments() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data: assessments, isLoading } = useListAssessments(
    { status: statusFilter || undefined },
    { query: { refetchInterval: 5000 } }
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Assessment Queue"
        subtitle={`${assessments?.length ?? 0} AI intelligence reports`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            className="px-2.5 py-1.5 text-xs bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Valuation (Mid)</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Confidence</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Liquidity</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Rec. LTV</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Risk</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Fraud Score</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={10} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : assessments?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-muted-foreground">No assessments found</div>
                    <div className="text-muted-foreground/60 text-[11px] mt-1">Run an AI assessment from any property page</div>
                  </td>
                </tr>
              ) : (
                [...(assessments ?? [])].reverse().map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">#{a.id}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={statusBadgeClass(a.status)}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatINR(a.valuationMid)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {a.confidenceScore != null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", scoreColor(a.confidenceScore))} style={{ width: `${a.confidenceScore}%` }} />
                          </div>
                          <span className="font-mono text-foreground">{Math.round(a.confidenceScore)}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {a.liquidityScore != null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", scoreColor(a.liquidityScore))} style={{ width: `${a.liquidityScore}%` }} />
                          </div>
                          <span className="font-mono text-foreground">{Math.round(a.liquidityScore)}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{a.recommendedLtv != null ? `${a.recommendedLtv}%` : "—"}</td>
                    <td className="px-4 py-2.5">
                      {a.riskCategory ? (
                        <Badge className={riskBadgeClass(a.riskCategory)}>{a.riskCategory}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {a.fraudRiskScore != null ? (
                        <span className={cn("font-mono", a.fraudRiskScore > 60 ? "text-red-400" : a.fraudRiskScore > 35 ? "text-amber-400" : "text-emerald-400")}>
                          {Math.round(a.fraudRiskScore)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/assessments/${a.id}`}>
                        <a className="text-[10px] text-primary hover:underline">Report</a>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
