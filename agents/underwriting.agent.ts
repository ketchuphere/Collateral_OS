/**
 * Underwriting Agent (stub)
 * -------------------------
 * Specializes in LTV recommendations, risk verdicts, and loan approval
 * reasoning. Applies RBI guidelines and NBFC lending norms to produce
 * structured underwriting decisions.
 *
 * CURRENT IMPLEMENTATION
 * ----------------------
 * LTV logic lives in the assessment service:
 *   backend/src/services/assessment.service.ts  (recommendedLtv)
 * Underwriting advice is handled by the AI Copilot:
 *   backend/src/routes/ai/ai-copilot.ts
 *
 * PLANNED ENHANCEMENTS
 * --------------------
 * - Structured JSON output: { ltvRecommendation, riskVerdict, rationale, conditions }
 * - SARFAESI applicability check
 * - Recovery timeline estimation per city/property-type
 * - Comparable transaction analysis from RERA data
 */

import type { IAgent, AgentInput, AgentOutput } from "./base.agent";

export class UnderwritingAgent implements IAgent {
  name = "underwriting";
  description = "Produces LTV recommendations and structured risk verdicts for loan applications";

  async run(_input: AgentInput): Promise<AgentOutput> {
    // TODO: Implement structured underwriting decision engine
    throw new Error("UnderwritingAgent is not yet implemented.");
  }
}
