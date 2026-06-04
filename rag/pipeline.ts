/**
 * RAG (Retrieval-Augmented Generation) Layer
 * ===========================================
 *
 * CURRENT IMPLEMENTATION — Context Injection RAG
 * -----------------------------------------------
 * CollateralOS uses a "full-context injection" RAG pattern:
 * all relevant portfolio data is fetched from PostgreSQL and injected
 * into the LLM system prompt on every request.
 *
 *   Implementation: backend/src/services/copilot.service.ts
 *   buildCopilotContext() queries:
 *     - propertiesTable    (all properties)
 *     - assessmentsTable   (all assessments)
 *     - alertsTable        (unresolved alerts only)
 *     - loansTable         (all loans)
 *   ...and formats them as structured Markdown for injection.
 *
 * This approach is correct for portfolio sizes under ~1,000 entities.
 *
 *
 * PRODUCTION RAG ARCHITECTURE (planned)
 * ---------------------------------------
 * At scale, full-context injection hits context window limits.
 * The production architecture should use vector similarity search:
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │                  INGESTION PIPELINE                      │
 *  │                                                         │
 *  │  Property/Assessment data                               │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  Chunk into structured text records                     │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  Embed with text-embedding-3-small (OpenAI)             │
 *  │  or nomic-embed-text (local)                            │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  Store vectors in pgvector (or Pinecone)                │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │                  RETRIEVAL PIPELINE                      │
 *  │                                                         │
 *  │  User query                                             │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  Embed query → query vector                             │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  cosine_similarity search → top-k records               │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  Inject top-k into system prompt                        │
 *  │         │                                               │
 *  │         ▼                                               │
 *  │  LLM generates response with retrieved context          │
 *  └─────────────────────────────────────────────────────────┘
 *
 *
 * FILES IN THIS DIRECTORY
 *   pipeline.ts         — ingestion orchestrator
 *   embeddings.ts       — embedding generation
 *   retriever.ts        — similarity search interface
 *   chunker.ts          — document chunking strategy
 *   context-builder.ts  — context assembly for prompt injection
 */

export interface RagDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface RetrievalResult {
  document: RagDocument;
  score: number;
}

export interface IRagRetriever {
  retrieve(query: string, topK: number): Promise<RetrievalResult[]>;
}

export interface IRagEmbedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
