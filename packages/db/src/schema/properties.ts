import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  propertyType: text("property_type").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  area: real("area").notNull(),
  ownerName: text("owner_name"),
  ownerContact: text("owner_contact"),
  status: text("status").notNull().default("pending"),
  riskCategory: text("risk_category"),
  estimatedValue: real("estimated_value"),
  liquidityScore: real("liquidity_score"),
  latestAssessmentId: integer("latest_assessment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
