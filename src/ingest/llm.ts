/**
 * Provider adapter for the extraction and description passes.
 *
 * The pipeline only ever needs one operation — "given a system prompt, a user
 * prompt, and a JSON Schema, return parsed JSON" — so the surface stays small
 * and swapping providers is a one-line env change. That portability is the
 * point: pick a free provider for development, and re-run the eval harness
 * against a paid one before deciding what production uses.
 */

import type { Env, LlmProvider } from "./env.js";

export interface CompletionRequest {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}

export interface LlmClient {
  readonly provider: LlmProvider;
  readonly model: string;
  complete(req: CompletionRequest): Promise<unknown>;
}

class MissingDependencyError extends Error {
  constructor(pkg: string, provider: string) {
    super(
      `LLM_PROVIDER=${provider} needs the "${pkg}" package.\n` +
        `  Install it with:  npm install ${pkg}\n` +
        `  Or set LLM_PROVIDER=none in .env to run heuristics only.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

class AnthropicClient implements LlmClient {
  readonly provider = "anthropic" as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  private async ensureClient(): Promise<void> {
    if (this.client) return;
    let mod: { default: new (opts: { apiKey: string }) => unknown };
    try {
      mod = (await import("@anthropic-ai/sdk")) as never;
    } catch {
      throw new MissingDependencyError("@anthropic-ai/sdk", "anthropic");
    }
    this.client = new mod.default({ apiKey: this.apiKey });
  }

  async complete(req: CompletionRequest): Promise<unknown> {
    await this.ensureClient();

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 8000,
      // The system block is byte-identical across every product in a run, so a
      // cache breakpoint here turns ~250 full-price prefixes into 1 write plus
      // 249 reads. Nothing per-product may appear above this line.
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: req.schema } },
      messages: [{ role: "user", content: req.user }],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`Model declined the request (${response.stop_details?.category ?? "unknown"})`);
    }

    const text = response.content.find((b: { type: string }) => b.type === "text")?.text;
    if (!text) throw new Error("No text block in response");
    return JSON.parse(text) as unknown;
  }
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

class GeminiClient implements LlmClient {
  readonly provider = "gemini" as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  private async ensureClient(): Promise<void> {
    if (this.client) return;
    let mod: { GoogleGenAI: new (opts: { apiKey: string }) => unknown };
    try {
      mod = (await import("@google/genai")) as never;
    } catch {
      throw new MissingDependencyError("@google/genai", "gemini");
    }
    this.client = new mod.GoogleGenAI({ apiKey: this.apiKey });
  }

  async complete(req: CompletionRequest): Promise<unknown> {
    await this.ensureClient();

    // Gemini's responseSchema dialect is a subset of JSON Schema and rejects
    // some constructs we use (notably nullable enums). Asking for JSON mode and
    // describing the shape in the prompt is more portable, and zod validates
    // the result either way.
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: req.user,
      config: {
        systemInstruction: req.system,
        responseMimeType: "application/json",
        temperature: 0,
        maxOutputTokens: req.maxTokens ?? 8000,
      },
    });

    const text: string | undefined = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(stripCodeFence(text)) as unknown;
  }
}

/** Some models wrap JSON in a fenced block despite JSON mode. */
function stripCodeFence(text: string): string {
  const fenced = /^\s*```(?:json)?\s*\n([\s\S]*?)\n\s*```\s*$/.exec(text);
  return fenced?.[1] ?? text;
}

// ---------------------------------------------------------------------------

export function createLlmClient(env: Env): LlmClient | null {
  switch (env.LLM_PROVIDER) {
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) throw new Error("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty");
      return new AnthropicClient(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
    case "gemini":
      if (!env.GEMINI_API_KEY) throw new Error("LLM_PROVIDER=gemini but GEMINI_API_KEY is empty");
      return new GeminiClient(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    case "none":
      return null;
  }
}

/** Retry transient failures (rate limits, 5xx, malformed JSON) with backoff. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /429|rate.?limit|overload|timeout|5\d\d|JSON|Empty response/i.test(message);
      if (!retryable || attempt === attempts - 1) break;
      const delay = 1000 * 2 ** attempt + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Map with bounded concurrency, running the first item alone before fanning out.
 *
 * That warm-up matters for prompt caching: a cache entry only becomes readable
 * once the request that wrote it has started responding, so N simultaneous
 * requests with the same prefix would all miss and all pay the write premium.
 * One serial request first, then parallel, means one write and N-1 reads.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  const first = items[0];
  if (first !== undefined) results[0] = await fn(first, 0);
  if (items.length === 1) return results;

  let cursor = 1;
  const workers = Array.from({ length: Math.min(limit, items.length - 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await fn(item, index);
    }
  });

  await Promise.all(workers);
  return results;
}
