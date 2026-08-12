/**
 * Load data/catalog/products.json into the database.
 *
 *   npm run seed
 *
 * Idempotent: categories upsert by slug, products are replaced wholesale so a
 * re-run after tweaking extraction picks up the new values. Carts and orders are
 * never touched... except that products are, and cart_items/orders reference
 * products, so those are cleared too (see seedCatalog in src/lib/seed-catalog.ts).
 *
 * Do not run this at the same time as a `next dev` in this same directory —
 * PGlite is a single-writer, file-backed store and a second OS process
 * opening it while the dev server holds it open aborts both. If a dev server
 * is already running, use its own /api/admin/reseed route instead.
 */

import { driverKind } from "../src/db/client.js";
import { seedCatalog } from "../src/lib/seed-catalog.js";
import { query } from "../src/db/client.js";

async function main(): Promise<void> {
  const catalogPath = new URL("../data/catalog/products.json", import.meta.url);

  console.log(`Driver: ${await driverKind()}`);

  let result: { inserted: number; skipped: number };
  try {
    result = await seedCatalog(catalogPath);
  } catch {
    console.error("data/catalog/products.json not found or invalid. Run `npm run ingest` first.");
    process.exitCode = 1;
    return;
  }

  console.log(`Products: ${result.inserted} inserted${result.skipped > 0 ? `, ${result.skipped} skipped (no price)` : ""}`);

  const byCategory = await query<{ slug: string; n: string }>(
    `SELECT c.slug, count(*)::text AS n
       FROM products p JOIN categories c ON c.id = p.category_id
      GROUP BY c.slug ORDER BY count(*) DESC`,
  );
  console.log("\nPer category:");
  for (const row of byCategory) console.log(`  ${row.slug.padEnd(14)} ${row.n}`);

  const ftsHit = await query<{ title: string }>(
    `SELECT title FROM products
      WHERE search_tsv @@ websearch_to_tsquery('simple', $1) LIMIT 3`,
    ["realme"],
  );
  const jsonbHit = await query<{ n: string }>(
    `SELECT count(*)::text AS n FROM products WHERE (attrs->>'ram_gb')::int >= 8`,
  );

  console.log(`\nFTS check    : "realme" -> ${ftsHit.length} rows (${ftsHit[0]?.title ?? "none"})`);
  console.log(`JSONB check  : ram_gb >= 8 -> ${jsonbHit[0]?.n ?? 0} rows`);
  console.log("\nReady. Run `npm run dev`.");
}

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
