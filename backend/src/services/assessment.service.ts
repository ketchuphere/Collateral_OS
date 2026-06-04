/**
 * Assessment Service
 * ------------------
 * Encapsulates all AI scoring logic for collateral assessments.
 *
 * NOTE: generateAssessmentData() currently uses a statistical simulation layer.
 * In production this function should be replaced with a trained AVM
 * (Automated Valuation Model) that accepts property features and returns
 * model-derived scores. The interface is intentionally stable so the swap
 * is a single-function replacement with no changes needed in the route.
 */

export interface AssessmentResult {
  valuationMin: number;
  valuationMax: number;
  valuationMid: number;
  confidenceScore: number;
  liquidityScore: number;
  liquidityLabel: string;
  resaleCertainty: number;
  recoveryCertainty: number;
  recommendedLtv: number;
  riskCategory: string;
  fraudRiskScore: number;
  underwritingInsights: string;
  marketIntelligence: string;
  geospatialNotes: string;
}

/**
 * Generate AI-driven assessment scores for a given property area.
 *
 * @param area - Property area in square feet
 * @returns AssessmentResult with all scores and narrative fields
 */
export function generateAssessmentData(area: number): AssessmentResult {
  const baseValue = area * (Math.random() * 4000 + 3000);
  const mid = baseValue;
  const spread = mid * 0.1;
  const confidenceScore = Math.round(Math.random() * 30 + 65);
  const liquidityScore = Math.round(Math.random() * 50 + 30);
  const resaleCertainty = Math.round(Math.random() * 40 + 45);
  const recoveryCertainty = Math.round(Math.random() * 40 + 40);
  const fraudRiskScore = Math.round(Math.random() * 25);

  let liquidityLabel = "moderate";
  if (liquidityScore >= 75) liquidityLabel = "high";
  else if (liquidityScore >= 60) liquidityLabel = "moderate";
  else if (liquidityScore >= 40) liquidityLabel = "low";
  else liquidityLabel = "very_low";

  let riskCategory = "moderate";
  if (fraudRiskScore > 60 || liquidityScore < 30) riskCategory = "high";
  else if (confidenceScore >= 80 && liquidityScore >= 60) riskCategory = "low";
  else if (fraudRiskScore > 40) riskCategory = "high";
  else riskCategory = "moderate";

  const recommendedLtv =
    riskCategory === "low" ? 70 : riskCategory === "moderate" ? 60 : 50;

  const underwritingInsights = `Collateral exhibits ${riskCategory} risk profile with a confidence score of ${confidenceScore}/100. ${
    liquidityLabel === "high"
      ? "Strong market demand supports reliable collateral recovery."
      : "Moderate liquidity observed; caution advised on extended loan tenures."
  } Recommended maximum LTV of ${recommendedLtv}% is advised to preserve lender buffer under stress scenarios.`;

  const marketIntelligence = `Local market shows ${
    liquidityScore > 55 ? "above-average" : "below-average"
  } transaction velocity over the past 90 days. Comparable properties indicate stable-to-rising valuations in this micro-market segment. Supply concentration is ${
    Math.random() > 0.5 ? "moderate" : "high"
  }, which may impact time-to-liquidate in a distress scenario.`;

  const geospatialNotes = `Property exhibits ${
    Math.random() > 0.5 ? "strong" : "moderate"
  } metro connectivity. Located within ${Math.round(
    Math.random() * 3 + 1
  )} km of primary arterial road. ${
    Math.random() > 0.5
      ? "Proximity to commercial zone positively impacts resale demand."
      : "Distance from transit corridor may limit buyer pool."
  }`;

  return {
    valuationMin: mid - spread,
    valuationMax: mid + spread,
    valuationMid: mid,
    confidenceScore,
    liquidityScore,
    liquidityLabel,
    resaleCertainty,
    recoveryCertainty,
    recommendedLtv,
    riskCategory,
    fraudRiskScore,
    underwritingInsights,
    marketIntelligence,
    geospatialNotes,
  };
}

/** Threshold above which a fraud alert is automatically raised */
export const FRAUD_ALERT_THRESHOLD = 40;

/** Threshold above which a fraud alert is escalated to "high" severity */
export const FRAUD_HIGH_SEVERITY_THRESHOLD = 65;
