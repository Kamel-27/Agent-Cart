/**
 * Minimal .env loader. Node 20.6+ can do `--env-file`, but reading it here keeps
 * the npm scripts identical across Node versions and Windows/POSIX shells.
 */

import { readFileSync } from "node:fs";

export type LlmProvider = "anthropic" | "gemini" | "none";

export interface Env {
  LLM_PROVIDER: LlmProvider;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  INGEST_CONCURRENCY: number;
  SOURCE_BASE_URL: string;
}

let loaded = false;

function loadDotEnvOnce(): void {
  if (loaded) return;
  loaded = true;

  const path = new URL("../../.env", import.meta.url);
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return; // No .env is fine — everything has a default or is optional.
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Real environment variables win over the file.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function loadEnv(): Env {
  loadDotEnvOnce();

  const provider = (process.env.LLM_PROVIDER ?? "none").toLowerCase();
  if (provider !== "anthropic" && provider !== "gemini" && provider !== "none") {
    throw new Error(`LLM_PROVIDER must be one of: anthropic, gemini, none (got "${provider}")`);
  }

  const concurrency = Number.parseInt(process.env.INGEST_CONCURRENCY ?? "4", 10);

  return {
    LLM_PROVIDER: provider,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    INGEST_CONCURRENCY: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 4,
    SOURCE_BASE_URL: process.env.SOURCE_BASE_URL ?? "https://elhashimstore.com",
  };
}
