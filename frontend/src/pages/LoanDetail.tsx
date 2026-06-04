import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLoan,
  useGetProperty,
  useGetAssessment,
  useUpdateLoan,
  getGetLoanQueryKey,
  getGetPropertyQueryKey,
  getGetAssessmentQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import {
  formatINR,
  formatDate,
  statusBadgeClass,
  propertyTypeLabel,
  cn,
} from "@/lib/utils";
import { ArrowLeft, Building2, User, CreditCard } from "lucide-react";

const STATUSES = ["pending", "under_review", "approved", "rejected", "disbursed"];
const VERDICTS = ["safe", "caution", "high_risk"];

function verdictBadge(v: string | null | undefined) {
  if (!v) return null;
  const cls = v === "safe" ? "badge-safe" : v === "caution" ? "badge-caution" : "badge-high-risk";
  return <Badge className={cls}>{v.replace("_", " ")}</Badge>;
}

export default function LoanDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useGetLoan(id, {
    query: { enabled: !!id, queryKey: getGetLoanQueryKey(id) },
  });
  const { data: property } = useGetProperty(loan?.propertyId ?? 0, {
    query: { enabled: !!loan?.propertyId, queryKey: getGetPropertyQueryKey(loan?.propertyId ?? 0) },
  });
  const { data: assessment } = useGetAssessment(loan?.assessmentId ?? 0, {
    query: { enabled: !!loan?.assessmentId, queryKey: getGetAssessmentQueryKey(loan?.assessmentId ?? 0) },
  });

  const updateLoan = useUpdateLoan();

  const setStatus = async (status: string) => {
    await updateLoan.mutateAsync({ id, data: { status } });
    queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(id) });
  };

  const setVerdict = async (riskVerdict: string) => {
    await updateLoan.mutateAsync({ id, data: { riskVerdict } });
    queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(id) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Loan Detail" />
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Not Found" />
        <div className="flex-1 p-6 flex items-center justify-center text-muted-foreground text-sm">
          Loan not found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Loan #${loan.id} — ${loan.borrowerName}`}
        subtitle={`${formatINR(loan.loanAmount)} at ${loan.requestedLtv}% LTV`}
        action={
          <Link href="/loans">
            <a className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </a>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Loan info */}
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Loan Details</div>
              <div className="space-y-2">
                <div className="data-row">
                  <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Borrower</span>
                  <span className="text-foreground text-xs">{loan.borrowerName}</span>
                </div>
                {loan.borrowerContact && (
                  <div className="data-row">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="text-foreground text-xs font-mono">{loan.borrowerContact}</span>
                  </div>
                )}
                <div className="data-row">
                  <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Loan Amount</span>
                  <span className="text-foreground text-xs font-mono font-semibold">{formatINR(loan.loanAmount)}</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Requested LTV</span>
                  <span className="text-foreground text-xs font-mono">{loan.requestedLtv}%</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Approved LTV</span>
                  <span className={cn("text-xs font-mono", loan.approvedLtv != null ? "text-emerald-400" : "text-muted-foreground")}>
                    {loan.approvedLtv != null ? `${loan.approvedLtv}%` : "Pending"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusBadgeClass(loan.status)}>{loan.status.replace("_", " ")}</Badge>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Risk Verdict</span>
                  {verdictBadge(loan.riskVerdict) ?? <span className="text-muted-foreground text-xs">Not set</span>}
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground text-xs">{formatDate(loan.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Analyst actions */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Underwriter Actions</div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1.5">Update Status</div>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      disabled={loan.status === s || updateLoan.isPending}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] border transition-colors disabled:opacity-40",
                        loan.status === s
                          ? statusBadgeClass(s)
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1.5">Set Risk Verdict</div>
                <div className="flex gap-1">
                  {VERDICTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVerdict(v)}
                      disabled={loan.riskVerdict === v || updateLoan.isPending}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] border transition-colors disabled:opacity-40",
                        loan.riskVerdict === v
                          ? (v === "safe" ? "badge-safe" : v === "caution" ? "badge-caution" : "badge-high-risk")
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      {v.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Property */}
            {property && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Collateral Property
                  </div>
                  <Link href={`/properties/${property.id}`}>
                    <a className="text-[10px] text-primary hover:underline">View Property</a>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground text-[10px]">Address</div>
                    <div className="text-foreground">{property.address}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Type</div>
                    <div className="text-foreground">{propertyTypeLabel(property.propertyType)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Estimated Value</div>
                    <div className="text-foreground font-mono font-semibold">{formatINR(property.estimatedValue)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment summary */}
            {assessment && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-foreground">Linked Assessment</div>
                  <Link href={`/assessments/${assessment.id}`}>
                    <a className="text-[10px] text-primary hover:underline">View Report</a>
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground text-[10px]">Valuation</div>
                    <div className="font-mono text-foreground">{formatINR(assessment.valuationMid)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Confidence</div>
                    <div className="font-mono text-foreground">{assessment.confidenceScore ? Math.round(assessment.confidenceScore) : "—"}/100</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Rec. LTV</div>
                    <div className="font-mono text-foreground">{assessment.recommendedLtv ? `${assessment.recommendedLtv}%` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Fraud Score</div>
                    <div className={cn("font-mono", (assessment.fraudRiskScore ?? 0) > 40 ? "text-red-400" : "text-emerald-400")}>
                      {assessment.fraudRiskScore ? Math.round(assessment.fraudRiskScore) : "—"}
                    </div>
                  </div>
                </div>
                {assessment.underwritingInsights && (
                  <div className="text-xs text-foreground/80 bg-muted/20 rounded p-3 leading-relaxed">
                    {assessment.underwritingInsights}
                  </div>
                )}
              </div>
            )}

            {/* Analyst notes */}
            {loan.analystNotes && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs font-medium text-foreground mb-2">Analyst Notes</div>
                <p className="text-xs text-foreground/80 leading-relaxed">{loan.analystNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
