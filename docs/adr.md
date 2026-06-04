# Architecture Decision Records (ADR)

This document captures key architectural decisions made during the design
of CollateralOS, the reasoning behind them, and their trade-offs.

---

## ADR-001: pnpm Monorepo with Workspace Packages

**Status:** Accepted

**Context:**
CollateralOS has multiple concerns that share types: a React frontend, an
Express backend, a database schema, and an API spec. These need to share
TypeScript types without duplicating code.

**Decision:**
Use pnpm workspaces as a monorepo with separate packages for:
- `frontend/` — React SPA
- `backend/` — Express API
- `packages/db` — Drizzle schema and client
- `packages/api-spec` — OpenAPI 3.1 source of truth
- `packages/api-client-react` — generated TanStack Query hooks
- `packages/api-zod` — generated server-side Zod validators

**Rationale:**
- Single source of truth for types flows from DB schema → OpenAPI → generated clients
- pnpm workspace protocol (`workspace:*`) prevents version drift
- Code generation (Orval) ensures frontend and backend always agree on the API contract

**Trade-offs:**
- Initial setup complexity vs. a simple two-package structure
- All packages must be built in dependency order

---

## ADR-002: Groq + Llama 3.3 70B over OpenAI GPT-4

**Status:** Accepted

**Context:**
The AI Copilot and Portfolio Summary features require fast, streaming LLM
responses. The AI Copilot is called on every user message in a chat interface,
so latency matters significantly.

**Decision:**
Use Groq's inference API with Llama 3.3 70B Versatile for all LLM calls.

**Rationale:**
- Groq's custom LPU hardware delivers 200–500 tokens/second vs. ~30–80 for OpenAI
- First-token latency of ~300ms vs. ~1–2s for GPT-4
- Open-weight model reduces vendor lock-in
- Cost is significantly lower than GPT-4 Turbo at similar capability levels
- Llama 3.3 70B performs competitively with GPT-4 on structured reasoning tasks

**Trade-offs:**
- Less predictable output formatting compared to GPT-4 with strict JSON mode
- Groq rate limits can be hit under heavy usage (handled by SSE streaming)
- No function calling support in all Groq models (mitigated by prompt engineering)

---

## ADR-003: Server-Sent Events (SSE) over WebSockets for AI Streaming

**Status:** Accepted

**Context:**
AI responses need to stream incrementally to the browser for a good UX.
Two options: SSE (unidirectional server→client) or WebSockets (bidirectional).

**Decision:**
Use SSE (`text/event-stream`) for all AI streaming endpoints.

**Rationale:**
- AI responses are unidirectional (server sends, client receives)
- SSE works over standard HTTP/1.1 — no protocol upgrade required
- SSE automatically reconnects on connection drop
- Simpler to implement and proxy than WebSockets
- Works correctly behind most reverse proxies and CDNs without special config
- WebSockets add bidirectional complexity that isn't needed here

**Trade-offs:**
- SSE is limited to UTF-8 text (not binary) — fine for JSON-encoded text chunks
- Max concurrent SSE connections per browser origin is limited (~6 for HTTP/1.1)
  mitigated by HTTP/2 multiplexing in production

---

## ADR-004: Context-Injection RAG over Vector Search

**Status:** Accepted (for v1) — to be revisited at scale

**Context:**
The AI Copilot needs access to live portfolio data to answer questions like
"Which property has the highest fraud risk?" Two approaches:
1. Full-context injection: query all records, inject as text into the prompt
2. Vector RAG: embed records, retrieve top-k by semantic similarity at query time

**Decision:**
Use full-context injection for v1. Plan migration to vector RAG at scale.

**Rationale:**
- Current portfolio sizes (< 500 entities) fit comfortably in Llama 3.3's 128k context window
- Full-context ensures the model has complete visibility — no relevant records missed
- Simpler implementation with no additional infrastructure (no vector DB, no embedder)
- Allows faster iteration in v1

**Trade-offs:**
- Does not scale beyond ~1,000–2,000 entities before hitting context limits
- Higher latency at scale due to large prompt assembly
- Higher token cost per query

**Migration path:**
When portfolio exceeds 500 entities, implement vector RAG using pgvector.
See `vector_store/index.ts` for the interface and migration guide.

---

## ADR-005: Drizzle ORM over Prisma

**Status:** Accepted

**Context:**
The project needs a TypeScript-native ORM that supports PostgreSQL with
good type inference and schema management.

**Decision:**
Use Drizzle ORM with drizzle-kit for schema push and migrations.

**Rationale:**
- Drizzle generates SQL that is predictable and readable — no magic
- Schema is defined in TypeScript with full type inference
- `drizzle-zod` automatically generates Zod validators from the schema
- Lighter weight than Prisma — no Prisma Client generation step
- Better compatibility with `verbatimModuleSyntax` TypeScript config

**Trade-offs:**
- Smaller ecosystem and community than Prisma
- Some advanced query patterns require more boilerplate than Prisma
- `drizzle-kit push` is good for development; production needs migration files

---

## ADR-006: Assessment Engine as Simulation Layer (v1)

**Status:** Accepted — deliberate technical decision

**Context:**
Building a real AVM (Automated Valuation Model) requires:
- Labeled training data from RERA transaction feeds
- A trained ML model (XGBoost, LightGBM, or neural net)
- Infrastructure to serve the model (FastAPI, Triton, or SageMaker)
- Regular model retraining as market conditions change

None of this was available for v1.

**Decision:**
Implement a statistical simulation layer (`generateAssessmentData()`) that
produces realistic but randomly generated scores. Expose this through the
same interface a trained model would use.

**Rationale:**
- Allows the full platform (frontend, API, workflows) to be built and validated
- The function interface is stable — swap the body for a real model call
- Demonstrates the complete system architecture without the ML dependency
- Explicitly documented as a simulation in all relevant places

**Trade-offs:**
- Scores are not based on real market data
- Cannot be used for actual lending decisions in production
- Must be replaced before enterprise deployment

**Replacement guide:**
See `ml/models.ts` for the IMLModel interface. Implement the AVMModel class
and replace the call in `backend/src/services/assessment.service.ts`.
