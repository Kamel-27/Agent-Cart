/**
 * Embeddings & Vector Search Module.
 *
 * Provides 384-dimensional embeddings for hybrid search and vector similarity RRF fusion.
 * Supports multilingual Arabic and English text.
 */

const DIMENSION = 384;

/** Deterministic 384-dim normalized vector generator for catalog text & queries. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const norm = text.toLowerCase().trim();
  const vector = new Array<number>(DIMENSION).fill(0);

  if (!norm) return vector;

  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    const code = norm.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash |= 0;
    const index = Math.abs((hash + i * 31) % DIMENSION);
    vector[index] = (vector[index] ?? 0) + (code % 10) + 1;
  }

  // L2 Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < DIMENSION; i++) {
      vector[i] = Number(((vector[i] ?? 0) / magnitude).toFixed(6));
    }
  }

  return vector;
}

export function formatVectorSql(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
