import { useState } from "react";
import { Link } from "wouter";
import { useListLoans } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import { formatINR, formatDate, statusBadgeClass, cn } from "@/lib/utils";
import { Plus, CreditCard } from "lucide-react";

function verdictBadge(verdict: string | null | undefined) {
  if (!verdict) return null;
  const cls =
    verdict === "safe" ? "badge-safe" :
    verdict === "caution" ? "badge-caution" :
    "badge-high-risk";
  return <Badge className={cls}>{verdict.replace("_", " ")}</Badge>;
}

export default function Loans() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data: loans, isLoading } = useListLoans(
    { status: statusFilter || undefined },
    { query: { refetchInterval: 5000 } }
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Loan Applications"
        subtitle={`${loans?.length ?? 0} applications`}
        action={
          <Link href="/loans/new">
            <a className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" />
              New Application
            </a>
          </Link>
        }
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
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disbursed">Disbursed</option>
          </select>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Borrower</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Loan Amount</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Req. LTV</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Appr. LTV</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Verdict</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : loans?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-muted-foreground">No loan applications yet</div>
                    <Link href="/loans/new">
                      <a className="text-primary hover:underline mt-1 inline-block">Create a loan application</a>
                    </Link>
                  </td>
                </tr>
              ) : (
                [...(loans ?? [])].reverse().map((l) => (
                  <tr key={l.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{l.borrowerName}</div>
                      {l.borrowerContact && <div className="text-muted-foreground text-[10px] font-mono">{l.borrowerContact}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatINR(l.loanAmount)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{l.requestedLtv}%</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {l.approvedLtv != null ? (
                        <span className={cn(l.approvedLtv <= l.requestedLtv ? "text-emerald-400" : "text-amber-400")}>
                          {l.approvedLtv}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={statusBadgeClass(l.status)}>{l.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {verdictBadge(l.riskVerdict)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/loans/${l.id}`}>
                        <a className="text-[10px] text-primary hover:underline">View</a>
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
