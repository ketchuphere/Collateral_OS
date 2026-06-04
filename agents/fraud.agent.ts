/**
 * Fraud Detection Agent (stub)
 * ----------------------------
 * Specializes in collateral fraud signal analysis. Interprets fraud risk
 * scores from the assessment engine and provides detailed explanations
 * and recommended actions.
 *
 * CURRENT IMPLEMENTATION
 * ----------------------
 * Fraud detection is handled inline in the assessment service:
 *   backend/src/services/assessment.service.ts
 *   - fraudRiskScore > FRAUD_ALERT_THRESHOLD triggers an alert
 *
 * PLANNED ENHANCEMENTS
 * --------------------
 * - Cross-property fraud pattern detection (same owner, similar inflated valuations)
 * - Image inconsistency detection (satellite vs. declared area)
 * - Integration with CERSAI fraud registry
 * - Temporal fraud signal analysis (multiple assessments on same property)
 */

import type { IAgent, AgentInput, AgentOutput } from "./base.agent";

export class FraudAgent implements IAgent {
  name = "fraud-detection";
  description = "Analyzes collateral fraud signals and recommends investigation actions";

  async run(_input: AgentInput): Promise<AgentOutput> {
    // TODO: Implement specialized fraud analysis
    throw new Error("FraudAgent is not yet implemented.");
  }
}
