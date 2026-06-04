/**
 * Orchestrator Agent (stub)
 * -------------------------
 * Routes incoming queries to the appropriate specialist agent and
 * synthesizes their outputs into a final response.
 *
 * IMPLEMENTATION ROADMAP
 * ----------------------
 * 1. Implement intent classification to detect query type
 *    (valuation / fraud / underwriting / general)
 * 2. Instantiate specialist agents and run in parallel where possible
 * 3. Merge responses with a synthesis prompt
 * 4. Return structured AgentOutput with confidence score
 *
 * Currently delegates to the monolithic Copilot route.
 * See: backend/src/routes/ai/ai-copilot.ts
 */

import type { IAgent, AgentInput, AgentOutput } from "./base.agent";

export class OrchestratorAgent implements IAgent {
  name = "orchestrator";
  description = "Routes queries to specialist agents and synthesizes results";

  async run(_input: AgentInput): Promise<AgentOutput> {
    // TODO: Implement multi-agent orchestration
    // Step 1: classify intent
    // Step 2: dispatch to specialist agents in parallel
    // Step 3: synthesize sub-agent outputs
    throw new Error("OrchestratorAgent is not yet implemented. Use ai-copilot route.");
  }
}
