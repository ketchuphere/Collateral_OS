# CollateralOS

> **AI-Native Collateral Intelligence Infrastructure for Secured Lending**

CollateralOS is a full-stack fintech AI platform that automates collateral risk assessment, fraud detection, and underwriting decision support for banks, NBFCs, and credit analysts operating in India's secured lending market.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [AI Pipeline](#ai-pipeline)
- [API Reference](#api-reference)
- [Installation](#installation)
- [Development](#development)
- [Architecture Decisions](#architecture-decisions)
- [Future Improvements](#future-improvements)

---

## Overview

CollateralOS replaces manual, spreadsheet-driven collateral appraisal workflows with an AI-native intelligence layer. When a lender registers a property as collateral, the platform automatically:

1. Runs a multi-factor AI assessment (valuation, liquidity, fraud, recovery certainty)
2. Generates a recommended LTV with a written underwriting narrative
3. Raises typed fraud/risk alerts if anomalies are detected
4. Surfaces the entire portfolio in real-time via a conversational AI copilot

Built for India's secured lending ecosystem — values in INR, cities across Indian geographies, LTV norms aligned with RBI guidelines (60–75%).

---

## Core Features

| Feature | Description |
|---|---|
| **Collateral Portfolio** | Register and track residential, commercial, land, and industrial properties |
| **AI Assessment Engine** | Per-property valuation range, risk scores, recommended LTV, and written narratives |
| **Fraud & Risk Alerts** | Auto-triggered alerts with 6 fraud types and 4 severity levels |
| **Loan Management** | Full loan application lifecycle from pending through disbursement |
| **AI Portfolio Summary** | Streaming LLM executive briefing on dashboard load (Llama 3.3 70B via Groq) |
| **AI Copilot (RAG)** | Multi-turn conversational interface with live portfolio context injection |
| **Geographic Intelligence** | Interactive India map with property scoring overlays (Leaflet) |
| **Market Stress Simulator** | Scenario modeling with 4 macro drivers and 4 preset scenarios |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 |
| Runtime | Node.js 24 |
| Package Manager | pnpm workspaces |
| Frontend | React 18 + Vite 7 |
| Routing | Wouter 3 |
| State / Data | TanStack Query v5 |
| UI Components | Shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Maps | React Leaflet |
| Charts | Recharts |
| Animation | Framer Motion |
| Backend | Express 5 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 15+ |
| API Contract | OpenAPI 3.1 (Orval codegen) |
| LLM Provider | Groq API |
| LLM Model | Llama 3.3 70B Versatile |
| AI Streaming | Server-Sent Events (SSE) |
| Logging | Pino + pino-http |

---

## Repository Structure

```
collateral-os/
├── frontend/                   # React SPA
│   └── src/
│       ├── components/
│       │   ├── layout/         # Layout, PageHeader
│       │   ├── widgets/        # AI widgets, gauges, score bars
│       │   └── ui/             # Shadcn/ui primitives
│       ├── pages/              # All route-level page components
│       ├── hooks/              # use-mobile, use-toast
│       └── lib/                # utils (formatINR, timeAgo, cn)
│
├── backend/                    # Express 5 API server
│   └── src/
│       ├── routes/
│       │   ├── core/           # properties, assessments, loans, alerts, dashboard
│       │   └── ai/             # ai-chat, ai-copilot, ai-portfolio-summary
│       ├── services/           # assessment.service, copilot.service
│       └── lib/                # logger, ai-client (Groq singleton)
│
├── packages/
│   ├── db/                     # Drizzle schema + PostgreSQL client
│   ├── api-spec/               # OpenAPI 3.1 source of truth + Orval config
│   ├── api-client-react/       # Generated TanStack Query hooks (auto-generated)
│   └── api-zod/                # Generated server-side Zod validators (auto-generated)
│
├── agents/                     # Agent architecture (orchestrator, fraud, underwriting)
├── rag/                        # RAG pipeline interfaces and documentation
├── ml/                         # ML model interfaces and AVM swap guide
├── models/                     # LLM model registry and configurations
├── prompts/                    # Centralized prompt registry (versioned)
├── vector_store/               # Vector store interface (pgvector / Pinecone)
├── data/                       # Seed script and fixtures
├── configs/                    # Environment config and .env.example
├── scripts/                    # setup.sh, codegen.sh, post-merge.sh
├── tests/
│   ├── unit/                   # Assessment service unit tests
│   ├── integration/            # API route integration tests
│   └── e2e/                    # Playwright critical journey tests
└── docs/                       # ADRs, AI system docs, architecture context
```

---

## AI Pipeline

### Three AI Modes

```
┌──────────────────────────────────────────────────────────────┐
│  Mode 1: General Chat Assistant  (/api/ai-chat)              │
│  Static domain knowledge · No DB access · Help queries       │
├──────────────────────────────────────────────────────────────┤
│  Mode 2: Underwriting Copilot  (/api/ai-copilot)             │
│  Live portfolio RAG · Multi-turn · LTV/fraud decisions       │
├──────────────────────────────────────────────────────────────┤
│  Mode 3: Portfolio Summary  (/api/ai-portfolio-summary)      │
│  Targeted KPI queries · One-shot · Executive briefing        │
└──────────────────────────────────────────────────────────────┘
```

### RAG Pattern (Copilot)

```
User query
    │
    ▼
buildCopilotContext()          ← copilot.service.ts
  ├── SELECT * FROM properties
  ├── SELECT * FROM assessments
  ├── SELECT * FROM alerts WHERE resolved = false
  └── SELECT * FROM loans
    │
    ▼
system = BASE_SYSTEM + portfolio_snapshot
    │
    ▼
Groq stream (llama-3.3-70b-versatile)
    │
    ▼
SSE chunks → browser incremental render
```

### Assessment Pipeline

```
POST /api/assessments { propertyId }
    │
    ▼
generateAssessmentData(area)   ← assessment.service.ts
  ├── valuation (min / mid / max)
  ├── confidence, liquidity, resale, recovery scores
  ├── riskCategory + recommendedLtv
  └── 3 narrative text fields
    │
    ├── INSERT assessment
    ├── UPDATE property (status, riskCategory, estimatedValue)
    ├── if fraudRiskScore > 40: INSERT alert
    └── INSERT activity
```

> **Note on the ML layer:** `generateAssessmentData()` currently uses a statistical simulation. This is intentional for v1. The function interface is stable — replace its body with a trained AVM call to activate real model inference. See `ml/models.ts` for the interface.

---

## API Reference

All routes are prefixed `/api`. AI routes return `Content-Type: text/event-stream`.

### Core Routes

| Method | Path | Description |
|---|---|---|
| GET | /properties | List properties (filter: status, riskCategory, search) |
| POST | /properties | Register collateral property |
| GET | /properties/:id | Property details |
| PATCH | /properties/:id | Update property |
| POST | /assessments | Trigger AI assessment |
| GET | /assessments/:id | Full assessment report |
| GET | /loans | List loan applications |
| POST | /loans | Create loan application |
| PATCH | /loans/:id | Update loan status / verdict |
| GET | /alerts | List alerts (filter: severity, resolved) |
| PATCH | /alerts/:id/resolve | Resolve alert |
| GET | /dashboard/summary | Portfolio KPIs |
| GET | /dashboard/activity | Activity feed |
| GET | /dashboard/risk-distribution | Risk breakdown |

### AI Routes (SSE)

| Method | Path | Description |
|---|---|---|
| POST | /ai-chat | General platform assistant |
| POST | /ai-copilot | Underwriting copilot with live RAG |
| GET | /ai-portfolio-summary | Executive portfolio briefing |

SSE format: `data: {"content": "..."}\n\n` ... `data: {"done": true}\n\n`

---

## Installation

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL 15+

### Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/collateral-os
cd collateral-os
pnpm install

# Configure environment
cp configs/env.example .env
# Edit .env: set DATABASE_URL and GROQ_API_KEY

# Set up database
pnpm db:push

# Seed demo data (optional)
pnpm tsx data/seed.ts

# Start development servers
pnpm dev:backend    # Terminal 1 — API on port 5000
pnpm dev:frontend   # Terminal 2 — UI on port 5173
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GROQ_API_KEY` | ✅ | Groq API key (console.groq.com) |
| `PORT` | No | API server port (default: 5000) |
| `LOG_LEVEL` | No | debug/info/warn/error (default: info) |
| `CORS_ORIGIN` | No | Frontend origin (default: localhost:5173) |

---

## Development

```bash
# Regenerate API client after OpenAPI changes
pnpm codegen

# Type-check all packages
pnpm typecheck

# Run unit tests
pnpm test

# Build all packages
pnpm build

# Open Drizzle Studio (DB browser)
pnpm --filter @collateral-os/db run studio
```

---

## Architecture Decisions

Key decisions and their rationale are documented in `docs/adr.md`:

- **ADR-001** — pnpm Monorepo structure
- **ADR-002** — Groq + Llama 3.3 70B over OpenAI
- **ADR-003** — SSE over WebSockets for AI streaming
- **ADR-004** — Context-injection RAG over vector search (v1)
- **ADR-005** — Drizzle ORM over Prisma
- **ADR-006** — Simulation layer as v1 ML placeholder

---

## Future Improvements

### AI / ML
- Replace simulation layer with trained AVM (XGBoost on RERA transaction data)
- Implement vector RAG with pgvector for portfolios > 1,000 properties
- Add multi-agent architecture (orchestrator → valuation/fraud/underwriting agents)
- Integrate CERSAI fraud registry for cross-lender alert correlation

### Backend
- JWT authentication + role-based access (analyst / manager / admin)
- Rate limiting on AI endpoints
- Background job queue (BullMQ) for async assessment processing
- WebSocket progress events during assessment

### Infrastructure
- Docker Compose for local development
- GitHub Actions CI (typecheck + lint + tests)
- OpenTelemetry tracing for AI call latency

### Frontend
- PDF export for assessment reports
- Bulk assessment trigger
- Offline PWA support for field inspectors

---

## License

Private / proprietary. All rights reserved.
