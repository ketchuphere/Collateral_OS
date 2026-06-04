/**
 * AI Client
 * ---------
 * Centralized Groq SDK client.
 *
 * Validates the API key at module load time so any misconfiguration
 * fails fast at server startup rather than silently at first request.
 */

import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "GROQ_API_KEY environment variable is required. " +
      "Obtain a key from https://console.groq.com and set it before starting the server."
  );
}

/** Shared Groq client — import this instead of instantiating Groq per route */
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/** Default LLM model used across all AI routes */
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
