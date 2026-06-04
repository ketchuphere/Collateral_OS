/**
 * Model Registry
 * ==============
 * Central registry of all AI models used in CollateralOS.
 * Import model identifiers and configs from here instead of
 * hardcoding them in route files.
 *
 * ACTIVE MODELS
 * ─────────────
 * These models are currently in use in production.
 *
 * AVAILABLE MODELS (not yet active)
 * ─────────────────────────────────
 * These are ready to swap in. Change the DEFAULT_* exports to activate.
 */

// ─── LLM Models (via Groq) ────────────────────────────────────────────────────

export const LLM_MODELS = {
  /** Active: main model used for all AI features */
  LLAMA_3_3_70B: "llama-3.3-70b-versatile",

  /** Faster, lower cost — suitable for portfolio summary */
  LLAMA_3_1_8B: "llama-3.1-8b-instant",

  /** Highest quality — use for complex underwriting decisions */
  LLAMA_3_3_70B_SPECULATIVE: "llama-3.3-70b-specdec",
} as const;

export type LLMModel = (typeof LLM_MODELS)[keyof typeof LLM_MODELS];

/** Default model used across all AI routes */
export const DEFAULT_LLM_MODEL: LLMModel = LLM_MODELS.LLAMA_3_3_70B;

/** Lightweight model for high-frequency/low-stakes calls (e.g., portfolio summary) */
export const SUMMARY_LLM_MODEL: LLMModel = LLM_MODELS.LLAMA_3_1_8B;

// ─── Embedding Models ─────────────────────────────────────────────────────────

export const EMBEDDING_MODELS = {
  /** OpenAI — production standard, 1536 dimensions */
  OPENAI_SMALL: "text-embedding-3-small",

  /** OpenAI — highest accuracy, 3072 dimensions */
  OPENAI_LARGE: "text-embedding-3-large",

  /** Local / Ollama — 768 dimensions, no API cost */
  NOMIC_EMBED: "nomic-embed-text",
} as const;

export type EmbeddingModel = (typeof EMBEDDING_MODELS)[keyof typeof EMBEDDING_MODELS];

// ─── Model Configuration ──────────────────────────────────────────────────────

export interface ModelConfig {
  model: LLMModel;
  maxTokens: number;
  temperature?: number;
  topP?: number;
}

/** Config for the AI Underwriting Copilot */
export const COPILOT_MODEL_CONFIG: ModelConfig = {
  model: DEFAULT_LLM_MODEL,
  maxTokens: 1024,
  temperature: 0.3,
};

/** Config for the Portfolio Summary (shorter, more deterministic) */
export const SUMMARY_MODEL_CONFIG: ModelConfig = {
  model: DEFAULT_LLM_MODEL,
  maxTokens: 256,
  temperature: 0.2,
};

/** Config for the General Chat Assistant */
export const CHAT_MODEL_CONFIG: ModelConfig = {
  model: DEFAULT_LLM_MODEL,
  maxTokens: 1024,
  temperature: 0.5,
};
