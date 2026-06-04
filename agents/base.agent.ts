/**
 * Agents Layer
 * ============
 * This directory contains the agentic AI architecture for CollateralOS.
 *
 * CURRENT STATE
 * -------------
 * The platform currently uses a single-agent pattern: every LLM call is
 * handled by one model (Llama 3.3 70B via Groq) with the full portfolio
 * context injected at query time. See:
 *   backend/src/routes/ai/ai-copilot.ts  — underwriting copilot
 *   backend/src/routes/ai/ai-chat.ts     — general assistant
 *   backend/src/routes/ai/ai-portfolio-summary.ts — executive summary
 *
 * PLANNED MULTI-AGENT ARCHITECTURE
 * ---------------------------------
 * Production roadmap: split into specialized agents coordinated by an
 * orchestrator. Each agent has a narrowly scoped responsibility and
 * its own system prompt and tool set.
 *
 *   ┌────────────────────────────────────────────────┐
 *   │              Orchestrator Agent                 │
 *   │   routes queries, merges sub-agent responses    │
 *   └────┬──────────┬──────────────┬─────────────────┘
 *        │          │              │
 *   ┌────▼───┐  ┌───▼──────┐  ┌───▼────────────┐
 *   │Valuation│  │  Fraud   │  │  Underwriting  │
 *   │ Agent  │  │  Agent   │  │    Agent       │
 *   └────────┘  └──────────┘  └────────────────┘
 *
 * FILES IN THIS DIRECTORY (stubs ready for implementation)
 *   orchestrator.agent.ts   — query routing and response synthesis
 *   valuation.agent.ts      — AVM calls, comparable analysis
 *   fraud.agent.ts          — anomaly detection, alert generation
 *   underwriting.agent.ts   — LTV decisions, risk verdict writing
 *   base.agent.ts           — shared interface all agents implement
 */

/** Shared interface every agent must implement */
export interface IAgent {
  name: string;
  description: string;
  run(input: AgentInput): Promise<AgentOutput>;
}

export interface AgentInput {
  query: string;
  context?: Record<string, unknown>;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentOutput {
  response: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
