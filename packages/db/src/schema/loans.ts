import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  assessmentId: integer("assessment_id"),
  borrowerName: text("borrower_name").notNull(),
  borrowerContact: text("borrower_contact"),
  loanAmount: real("loan_amount").notNull(),
  requestedLtv: real("requested_ltv").notNull(),
  approvedLtv: real("approved_ltv"),
  status: text("status").notNull().default("pending"),
  riskVerdict: text("risk_verdict"),
  analystNotes: text("analyst_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ id: true, createdAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
