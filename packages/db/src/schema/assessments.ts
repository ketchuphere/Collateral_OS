import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  status: text("status").notNull().default("pending"),
  valuationMin: real("valuation_min"),
  valuationMax: real("valuation_max"),
  valuationMid: real("valuation_mid"),
  confidenceScore: real("confidence_score"),
  liquidityScore: real("liquidity_score"),
  liquidityLabel: text("liquidity_label"),
  resaleCertainty: real("resale_certainty"),
  recoveryCertainty: real("recovery_certainty"),
  recommendedLtv: real("recommended_ltv"),
  riskCategory: text("risk_category"),
  fraudRiskScore: real("fraud_risk_score"),
  underwritingInsights: text("underwriting_insights"),
  marketIntelligence: text("market_intelligence"),
  geospatialNotes: text("geospatial_notes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;
