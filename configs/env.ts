/**
 * Environment Configuration
 * =========================
 * Centralised env var validation and typed access.
 * Import `config` from this file instead of accessing process.env directly.
 *
 * USAGE
 * -----
 *   import { config } from "@/configs/env";
 *   const url = config.DATABASE_URL;
 *
 * All variables are validated at module load time. Missing required vars
 * throw immediately with a clear error message, preventing silent failures
 * at request time.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `  Set it in your .env file or deployment environment before starting the server.\n` +
      `  See configs/env.example for reference.`
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // ── AI / LLM ──────────────────────────────────────────────────────────────
  GROQ_API_KEY: requireEnv("GROQ_API_KEY"),

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: parseInt(optionalEnv("PORT", "5000"), 10),
  NODE_ENV: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  LOG_LEVEL: optionalEnv("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",

  // ── CORS ──────────────────────────────────────────────────────────────────
  CORS_ORIGIN: optionalEnv("CORS_ORIGIN", "http://localhost:5173"),

  // ── Feature Flags ─────────────────────────────────────────────────────────
  /** Enable vector store RAG (requires pgvector or Pinecone setup) */
  ENABLE_VECTOR_RAG: optionalEnv("ENABLE_VECTOR_RAG", "false") === "true",

  /** Optional: Pinecone API key for vector store */
  PINECONE_API_KEY: process.env["PINECONE_API_KEY"],
  PINECONE_INDEX: process.env["PINECONE_INDEX"],

  /** Optional: OpenAI API key for embeddings */
  OPENAI_API_KEY: process.env["OPENAI_API_KEY"],
} as const;

export type Config = typeof config;
