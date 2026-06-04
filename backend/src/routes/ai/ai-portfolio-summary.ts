import { Router } from "express";
import { groq, DEFAULT_MODEL } from "../../lib/ai-client";
import { db } from "@collateral-os/db";
import {
  propertiesTable,
  assessmentsTable,
  loansTable,
  alertsTable,
} from "@collateral-os/db";
import { eq, count, avg, sum } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const [propStats] = await db
    .select({ total: count(), avgLiquidity: avg(propertiesTable.liquidityScore), totalValue: sum(propertiesTable.estimatedValue) })
    .from(propertiesTable);

  const [loanStats] = await db
    .select({ total: count() })
    .from(loansTable)
    .where(eq(loansTable.status, "approved"));

  const [disbursed] = await db
    .select({ total: count() })
    .from(loansTable)
    .where(eq(loansTable.status, "disbursed"));

  const openAlerts = await db
    .select({ id: alertsTable.id, severity: alertsTable.severity, alertType: alertsTable.alertType, message: alertsTable.message, propertyId: alertsTable.propertyId })
    .from(alertsTable)
    .where(eq(alertsTable.resolved, false))
    .limit(10);

  const highRiskProperties = await db
    .select({ id: propertiesTable.id, address: propertiesTable.address, city: propertiesTable.city, riskCategory: propertiesTable.riskCategory, liquidityScore: propertiesTable.liquidityScore, estimatedValue: propertiesTable.estimatedValue })
    .from(propertiesTable)
    .where(eq(propertiesTable.riskCategory, "high"))
    .limit(5);

  const criticalProperties = await db
    .select({ id: propertiesTable.id, address: propertiesTable.address, city: propertiesTable.city, riskCategory: propertiesTable.riskCategory })
    .from(propertiesTable)
    .where(eq(propertiesTable.riskCategory, "critical"))
    .limit(5);

  const recentAssessments = await db
    .select({
      id: assessmentsTable.id,
      propertyId: assessmentsTable.propertyId,
      riskCategory: assessmentsTable.riskCategory,
      fraudRiskScore: assessmentsTable.fraudRiskScore,
      liquidityScore: assessmentsTable.liquidityScore,
      confidenceScore: assessmentsTable.confidenceScore,
      recommendedLtv: assessmentsTable.recommendedLtv,
      valuationMid: assessmentsTable.valuationMid,
    })
    .from(assessmentsTable)
    .where(eq(assessmentsTable.status, "completed"))
    .limit(10);

  const [avgConfidence] = await db
    .select({ avg: avg(assessmentsTable.confidenceScore) })
    .from(assessmentsTable)
    .where(eq(assessmentsTable.status, "completed"));

  const [pendingLoans] = await db
    .select({ count: count() })
    .from(loansTable)
    .where(eq(loansTable.status, "pending"));

  const [underReviewLoans] = await db
    .select({ count: count() })
    .from(loansTable)
    .where(eq(loansTable.status, "under_review"));

  const fraudAlerts = openAlerts.filter(
    (a) => a.alertType === "inflated_valuation" || a.alertType === "suspicious_pricing" || a.alertType === "fake_size"
  );

  const totalValue = Number(propStats.totalValue ?? 0);
  const recoveryCap = totalValue * 0.72;

  const gurugramProps = await db
    .select({ liquidityScore: propertiesTable.liquidityScore, estimatedValue: propertiesTable.estimatedValue })
    .from(propertiesTable)
    .where(eq(propertiesTable.city, "Gurugram"));

  const avgGurugramLiquidity = gurugramProps.length
    ? gurugramProps.reduce((s, p) => s + (p.liquidityScore ?? 0), 0) / gurugramProps.length
    : null;

  const context = {
    totalProperties: Number(propStats.total ?? 0),
    avgLiquidityScore: Math.round(Number(propStats.avgLiquidity ?? 0)),
    totalPortfolioValue: `₹${(totalValue / 10000000).toFixed(2)} Cr`,
    estimatedRecoveryValue: `₹${(recoveryCap / 10000000).toFixed(1)} Cr`,
    activeLoans: Number(loanStats.total ?? 0),
    disbursedLoans: Number(disbursed.total ?? 0),
    pendingLoans: Number(pendingLoans.count ?? 0),
    loansUnderReview: Number(underReviewLoans.count ?? 0),
    openAlerts: openAlerts.length,
    criticalAlerts: openAlerts.filter((a) => a.severity === "critical").length,
    highAlerts: openAlerts.filter((a) => a.severity === "high").length,
    fraudAlerts: fraudAlerts.length,
    fraudAlertMessages: fraudAlerts.map((a) => a.message).join("; "),
    highRiskProperties: highRiskProperties.map((p) => `${p.address}, ${p.city}`).join("; "),
    criticalProperties: criticalProperties.map((p) => `${p.address}, ${p.city}`).join("; "),
    avgConfidenceScore: Math.round(Number(avgConfidence.avg ?? 0)),
    propertiesNeedingReview: highRiskProperties.length + criticalProperties.length + fraudAlerts.length,
    gurugramAvgLiquidity: avgGurugramLiquidity != null ? Math.round(avgGurugramLiquidity) : null,
    gurugramProperties: gurugramProps.length,
    topFraudAlertMessage: fraudAlerts[0]?.message ?? null,
  };

  const prompt = `You are an AI portfolio intelligence engine for CollateralOS, a secured lending platform in India.

Given the current portfolio state below, generate a concise executive summary for a credit analyst or bank manager. The tone is professional, factual, and direct — like a Bloomberg terminal briefing.

Structure it EXACTLY like this (do not add extra sections or deviate from the format):

Line 1: One sentence status (e.g. "Portfolio health remains stable." or "Portfolio requires immediate attention.")

Blank line

Then 3–5 bullet points (use • symbol) covering: properties needing review, regional risk changes if any, recovery value estimate, fraud flags, loan pipeline status. Each bullet is one crisp sentence.

Blank line

Then: "Recommended Action:" on its own line, followed by one actionable sentence for the analyst.

Keep the entire response under 120 words. Be specific — use real numbers from the data. Use INR crore notation (₹X Cr). Do not mention "AI" or "model" in the output.

Portfolio Data:
${JSON.stringify(context, null, 2)}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Failed to generate summary" })}\n\n`);
    res.end();
  }
});

export default router;
