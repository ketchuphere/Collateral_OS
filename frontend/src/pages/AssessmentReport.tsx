import { Link } from "wouter";
import {
  useGetAssessment,
  useGetProperty,
  getGetAssessmentQueryKey,
  getGetPropertyQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import { ScoreBar } from "@/components/widgets/ScoreBar";
import {
  formatINR,
  formatDate,
  riskBadgeClass,
  statusBadgeClass,
  cn,
  scoreColor,
} from "@/lib/utils";
import { ArrowLeft, AlertTriangle, TrendingUp, MapPin, FileText } from "lucide-react";

function MetricGauge({ label, value, sub }: { label: string; value: number | null | undefined; sub?: string }) {
  const pct = value != null ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="bg-muted/20 rounded-lg p-3 text-center space-y-1.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold font-mono text-foreground">{value != null ? Math.round(value) : "—"}</div>
      <div className="score-bar mx-auto max-w-[80px]">
        <div className={cn("score-bar-fill", scoreColor(value))} style={{ width: `${pct}%` }} />
      </div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function NarrativeBlock({ icon: Icon, title, text, accent }: {
  icon: React.ElementType;
  title: string;
  text: string | null | undefined;
  accent?: string;
}) {
  if (!text) return null;
  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-2", accent ?? "border-border")}>
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", accent ? "text-primary" : "text-foreground")}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

export default function AssessmentReport({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  const { data: assessment, isLoading } = useGetAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) },
  });

  const { data: property } = useGetProperty(assessment?.propertyId ?? 0, {
    query: {
      enabled: !!assessment?.propertyId,
      queryKey: getGetPropertyQueryKey(assessment?.propertyId ?? 0),
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Assessment Report" />
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Not Found" />
        <div className="flex-1 p-6 flex items-center justify-center text-muted-foreground text-sm">
          Assessment not found.
        </div>
      </div>
    );
  }

  const fraudHigh = assessment.fraudRiskScore != null && assessment.fraudRiskScore > 40;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Assessment Report #${assessment.id}`}
        subtitle={property ? `${property.address} · ${property.city}` : "Loading property..."}
        action={
          <div className="flex items-center gap-2">
            <Link href="/assessments">
              <a className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </a>
            </Link>
            {property && (
              <Link href={`/properties/${property.id}`}>
                <a className="text-xs text-primary hover:underline">View Property</a>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Status + Risk header */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusBadgeClass(assessment.status)}>{assessment.status}</Badge>
          {assessment.riskCategory && (
            <Badge className={riskBadgeClass(assessment.riskCategory)}>{assessment.riskCategory} risk</Badge>
          )}
          {fraudHigh && (
            <Badge className="badge-high flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Fraud Risk Elevated
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Completed {formatDate(assessment.completedAt ?? assessment.createdAt)}
          </span>
        </div>

        {/* Valuation range */}
        {assessment.valuationMid != null && (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="text-xs text-muted-foreground mb-1">AI Valuation Range</div>
            <div className="flex items-end gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground">Minimum</div>
                <div className="text-lg font-mono text-foreground">{formatINR(assessment.valuationMin)}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-muted-foreground">Mid-Point Estimate</div>
                <div className="text-3xl font-semibold font-mono text-primary">{formatINR(assessment.valuationMid)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Maximum</div>
                <div className="text-lg font-mono text-foreground">{formatINR(assessment.valuationMax)}</div>
              </div>
            </div>
            <div className="mt-3 relative h-2 bg-muted rounded-full">
              <div className="absolute inset-y-0 left-[10%] right-[10%] bg-primary/20 rounded-full" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary rounded-full" />
            </div>
          </div>
        )}

        {/* Intelligence metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricGauge label="Confidence Score" value={assessment.confidenceScore} sub="AI certainty" />
          <MetricGauge label="Liquidity Score" value={assessment.liquidityScore} sub={assessment.liquidityLabel?.replace("_", " ")} />
          <MetricGauge label="Resale Certainty" value={assessment.resaleCertainty} sub="Secondary market" />
          <MetricGauge label="Recovery Certainty" value={assessment.recoveryCertainty} sub="Default scenario" />
          <MetricGauge label="Fraud Risk Score" value={assessment.fraudRiskScore} sub={fraudHigh ? "Elevated — review" : "Within normal range"} />
        </div>

        {/* Recommended LTV */}
        {assessment.recommendedLtv != null && (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold font-mono text-primary">{assessment.recommendedLtv}%</span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Recommended Maximum LTV</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                AI-recommended loan-to-value ratio based on valuation confidence, liquidity profile, and recovery certainty. Exceeding this threshold significantly increases lender risk exposure.
              </div>
            </div>
          </div>
        )}

        {/* Score detail bars */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-medium text-foreground mb-3">Intelligence Score Detail</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <ScoreBar score={assessment.confidenceScore} label="Valuation Confidence" />
              <ScoreBar score={assessment.liquidityScore} label="Collateral Liquidity" />
              <ScoreBar score={assessment.resaleCertainty} label="Resale Certainty" />
            </div>
            <div className="space-y-3">
              <ScoreBar score={assessment.recoveryCertainty} label="Recovery Certainty" />
              <ScoreBar score={100 - (assessment.fraudRiskScore ?? 0)} label="Fraud Safety Score" />
              <ScoreBar score={assessment.recommendedLtv} label={`Recommended LTV (${assessment.recommendedLtv ?? "—"}%)`} />
            </div>
          </div>
        </div>

        {/* Narrative blocks */}
        <div className="space-y-3">
          <NarrativeBlock
            icon={FileText}
            title="Underwriting Intelligence"
            text={assessment.underwritingInsights}
            accent="border-primary/30"
          />
          <NarrativeBlock
            icon={TrendingUp}
            title="Market Intelligence"
            text={assessment.marketIntelligence}
          />
          <NarrativeBlock
            icon={MapPin}
            title="Geospatial Analysis"
            text={assessment.geospatialNotes}
          />
        </div>
      </div>
    </div>
  );
}
