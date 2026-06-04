import { Router } from "express";
import { db } from "@collateral-os/db";
import { assessmentsTable, propertiesTable, alertsTable, activityTable } from "@collateral-os/db";
import { eq, and } from "drizzle-orm";
import {
  ListAssessmentsQueryParams,
  CreateAssessmentBody,
  GetAssessmentParams,
} from "@collateral-os/api-zod";
import {
  generateAssessmentData,
  FRAUD_ALERT_THRESHOLD,
  FRAUD_HIGH_SEVERITY_THRESHOLD,
} from "../../services/assessment.service";

const router = Router();

const fmt = (r: typeof assessmentsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  completedAt: r.completedAt?.toISOString() ?? null,
});

router.get("/", async (req, res) => {
  const query = ListAssessmentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const conditions = [];
  if (query.data.propertyId) conditions.push(eq(assessmentsTable.propertyId, query.data.propertyId));
  if (query.data.status) conditions.push(eq(assessmentsTable.status, query.data.status));

  const rows = await db
    .select()
    .from(assessmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(assessmentsTable.createdAt);

  res.json(rows.map(fmt));
});

router.post("/", async (req, res) => {
  const body = CreateAssessmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [property] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, body.data.propertyId));

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  const aiData = generateAssessmentData(property.area);
  const completedAt = new Date();

  const [assessment] = await db
    .insert(assessmentsTable)
    .values({
      ...body.data,
      status: "completed",
      completedAt,
      ...aiData,
    })
    .returning();

  await db
    .update(propertiesTable)
    .set({
      status: "assessed",
      riskCategory: aiData.riskCategory,
      estimatedValue: aiData.valuationMid,
      liquidityScore: aiData.liquidityScore,
      latestAssessmentId: assessment.id,
    })
    .where(eq(propertiesTable.id, body.data.propertyId));

  if (aiData.fraudRiskScore > FRAUD_ALERT_THRESHOLD) {
    await db.insert(alertsTable).values({
      propertyId: body.data.propertyId,
      assessmentId: assessment.id,
      alertType: "suspicious_pricing",
      severity: aiData.fraudRiskScore > FRAUD_HIGH_SEVERITY_THRESHOLD ? "high" : "medium",
      message: `Elevated fraud risk detected (score: ${aiData.fraudRiskScore}/100)`,
      details: "AI analysis flagged anomalies in pricing relative to comparable properties in this micro-market.",
      resolved: false,
    });
  }

  await db.insert(activityTable).values({
    type: "assessment_completed",
    description: `Assessment completed for property at ${property.address}`,
    entityId: assessment.id,
    entityType: "assessment",
  });

  res.status(201).json(fmt(assessment));
});

router.get("/:id", async (req, res) => {
  const params = GetAssessmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

export default router;
