/**
 * Copilot Context Service
 * -----------------------
 * Assembles the live portfolio snapshot that is injected into the AI
 * Underwriting Copilot system prompt on every request.
 *
 * This implements the RAG (Retrieval-Augmented Generation) pattern:
 * context is retrieved from the live database and injected into the LLM
 * prompt at query time, ensuring the model always reasons over current data.
 *
 * At scale (>1,000 properties) this full-context approach should be replaced
 * with a vector similarity search using pgvector or a dedicated vector store,
 * retrieving only the top-k most relevant records per query.
 */

import {
  db,
  propertiesTable,
  assessmentsTable,
  alertsTable,
  loansTable,
} from "@collateral-os/db";
import { eq } from "drizzle-orm";

/**
 * Fetch all live portfolio data and format it as a structured markdown
 * context string suitable for injection into an LLM system prompt.
 */
export async function buildCopilotContext(): Promise<string> {
  const [properties, assessments, alerts, loans] = await Promise.all([
    db.select().from(propertiesTable),
    db.select().from(assessmentsTable),
    db.select().from(alertsTable),
    db.select().from(loansTable),
  ]);

  const propLines = properties
    .map(
      (p) =>
        `  - Property #${p.id}: ${p.address} | ${p.propertyType} | ${p.city}, ${p.state} | Area: ${p.area} sqft | Owner: ${p.ownerName} | Value: ₹${((p.estimatedValue ?? 0) / 1e7).toFixed(2)} Cr | Liquidity: ${p.liquidityScore ?? "N/A"}`
    )
    .join("\n");

  const assessLines = assessments
    .map(
      (a) =>
        `  - Assessment #${a.id} → Property #${a.propertyId}: Confidence ${a.confidenceScore}% | Liquidity ${a.liquidityScore} | FraudRisk ${a.fraudRiskScore} | LTV Recommended ${a.recommendedLtv}% | Valuation ₹${((a.valuationMid ?? 0) / 1e7).toFixed(2)} Cr | Risk: ${a.riskCategory}`
    )
    .join("\n");

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const alertLines = activeAlerts.length
    ? activeAlerts
        .map(
          (a) =>
            `  - Alert #${a.id} → Property #${a.propertyId}: [${a.severity.toUpperCase()}] ${a.alertType} — ${a.message}`
        )
        .join("\n")
    : "  - No active alerts";

  const loanLines = loans
    .map(
      (l) =>
        `  - Loan #${l.id}: ${l.borrowerName} | Property #${l.propertyId} | Amount ₹${((l.loanAmount ?? 0) / 1e7).toFixed(2)} Cr | LTV ${l.requestedLtv}% | Status: ${l.status} | Risk: ${l.riskVerdict ?? "not set"}`
    )
    .join("\n");

  return `
## Live Portfolio Data (as of now)

### Properties (${properties.length} total)
${propLines || "  - No properties"}

### AI Assessments (${assessments.length} total)
${assessLines || "  - No assessments"}

### Active Fraud & Risk Alerts (${activeAlerts.length} unresolved)
${alertLines}

### Loan Applications (${loans.length} total)
${loanLines || "  - No loans"}
`.trim();
}
