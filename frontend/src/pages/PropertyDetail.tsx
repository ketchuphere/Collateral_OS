import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProperty,
  useListAssessments,
  useListLoans,
  useListAlerts,
  useCreateAssessment,
  getGetPropertyQueryKey,
  getListAssessmentsQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import { ScoreBar } from "@/components/widgets/ScoreBar";
import {
  formatINR,
  formatDate,
  propertyTypeLabel,
  riskBadgeClass,
  statusBadgeClass,
  severityBadgeClass,
  cn,
} from "@/lib/utils";
import { ArrowLeft, Plus, Building2, MapPin, User, Ruler } from "lucide-react";

export default function PropertyDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useGetProperty(id, {
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id) },
  });
  const { data: assessments } = useListAssessments(
    { propertyId: id },
    { query: { enabled: !!id, queryKey: getListAssessmentsQueryKey({ propertyId: id }) } }
  );
  const { data: loans } = useListLoans({ propertyId: id });
  const { data: alerts } = useListAlerts({ resolved: false });
  const propertyAlerts = alerts?.filter((a) => a.propertyId === id);

  const createAssessment = useCreateAssessment();

  const handleAssess = async () => {
    await createAssessment.mutateAsync({ data: { propertyId: id } });
    queryClient.invalidateQueries({ queryKey: getGetPropertyQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey({ propertyId: id }) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Property Detail" />
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Property Not Found" />
        <div className="flex-1 p-6 flex items-center justify-center text-muted-foreground text-sm">
          Property not found. <Link href="/properties" className="text-primary ml-1 hover:underline">Back to portfolio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={property.address}
        subtitle={`${propertyTypeLabel(property.propertyType)} · ${property.city}, ${property.state}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <button
              onClick={handleAssess}
              disabled={createAssessment.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {createAssessment.isPending ? "Running..." : "Run AI Assessment"}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Property info */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Property Information</div>
              <div className="space-y-2">
                <div className="data-row">
                  <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> Type</span>
                  <span className="text-foreground text-xs">{propertyTypeLabel(property.propertyType)}</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground flex items-center gap-1"><Ruler className="w-3 h-3" /> Area</span>
                  <span className="text-foreground text-xs font-mono">{property.area.toLocaleString()} sq.ft.</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                  <span className="text-foreground text-xs">{property.city}, {property.state}</span>
                </div>
                {property.ownerName && (
                  <div className="data-row">
                    <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Owner</span>
                    <span className="text-foreground text-xs">{property.ownerName}</span>
                  </div>
                )}
                {property.ownerContact && (
                  <div className="data-row">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="text-foreground text-xs font-mono">{property.ownerContact}</span>
                  </div>
                )}
                <div className="data-row">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusBadgeClass(property.status)}>{property.status.replace("_", " ")}</Badge>
                </div>
                {property.riskCategory && (
                  <div className="data-row">
                    <span className="text-muted-foreground">Risk</span>
                    <Badge className={riskBadgeClass(property.riskCategory)}>{property.riskCategory}</Badge>
                  </div>
                )}
              </div>
            </div>

            {property.estimatedValue != null && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="text-xs font-medium text-foreground">Intelligence Summary</div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Estimated Value</div>
                  <div className="text-2xl font-semibold font-mono text-foreground">{formatINR(property.estimatedValue)}</div>
                </div>
                {property.liquidityScore != null && (
                  <ScoreBar score={property.liquidityScore} label="Liquidity Score" />
                )}
              </div>
            )}

            {/* Active alerts */}
            {propertyAlerts && propertyAlerts.length > 0 && (
              <div className="bg-card border border-red-400/20 rounded-lg p-4 space-y-2">
                <div className="text-xs font-medium text-red-400">Active Alerts ({propertyAlerts.length})</div>
                {propertyAlerts.map((alert) => (
                  <div key={alert.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge className={severityBadgeClass(alert.severity)}>{alert.severity}</Badge>
                      <span className="text-foreground">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessments + Loans */}
          <div className="lg:col-span-2 space-y-4">
            {/* Assessments */}
            <div className="bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="text-xs font-medium text-foreground">AI Assessments</div>
                <button
                  onClick={handleAssess}
                  disabled={createAssessment.isPending}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  + New Assessment
                </button>
              </div>
              {assessments?.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No assessments yet. Run an AI assessment to get collateral intelligence.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {[...(assessments ?? [])].reverse().map((a) => (
                    <div key={a.id} className="px-4 py-3 hover:bg-muted/5 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge className={statusBadgeClass(a.status)}>{a.status}</Badge>
                          {a.riskCategory && <Badge className={riskBadgeClass(a.riskCategory)}>{a.riskCategory} risk</Badge>}
                        </div>
                        <Link href={`/assessments/${a.id}`}>
                          <a className="text-[10px] text-primary hover:underline">View Report</a>
                        </Link>
                      </div>
                      {a.valuationMid != null && (
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-muted-foreground text-[10px]">Valuation</div>
                            <div className="font-mono text-foreground">{formatINR(a.valuationMid)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">Confidence</div>
                            <div className="font-mono text-foreground">{a.confidenceScore ? Math.round(a.confidenceScore) : "—"}/100</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">Rec. LTV</div>
                            <div className="font-mono text-foreground">{a.recommendedLtv ? `${a.recommendedLtv}%` : "—"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loans */}
            <div className="bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="text-xs font-medium text-foreground">Loan Applications</div>
                <Link href="/loans/new">
                  <a className="text-[10px] text-primary hover:underline">+ New Application</a>
                </Link>
              </div>
              {loans?.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-xs">No loan applications linked to this property.</div>
              ) : (
                <div className="divide-y divide-border">
                  {loans?.map((l) => (
                    <div key={l.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-foreground">{l.borrowerName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{formatINR(l.loanAmount)} · LTV {l.requestedLtv}%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusBadgeClass(l.status)}>{l.status.replace("_", " ")}</Badge>
                          <Link href={`/loans/${l.id}`}>
                            <a className="text-[10px] text-primary hover:underline">View</a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
