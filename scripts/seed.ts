/**
 * Load data/catalog/products.json into the database.
 *
 *   npm run seed
 *
 * Idempotent: categories upsert by slug, products are replaced wholesale so a
 * re-run after tweaking extraction picks up the new values. Carts and orders are
 * never touched.
 */

import { readFile } from "node:fs/promises";
import { ensureSchema, query, queryOne, driverKind } from "../src/db/client.js";
import {
  CANONICAL_CATEGORIES,
  CATEGORY_ATTRS,
  CATEGORY_LABELS,
  type CanonicalCategory,
} from "../src/catalog/categories.js";

interface CatalogFile {
  generated_at: string;
  products: Array<{
    sku: string;
    slug: string;
    category: CanonicalCategory;
    brand: string | null;
    model: string | null;
    title: string;
    price_cents: number | null;
    regular_price_cents: number | null;
    currency: string;
    on_sale: boolean;
    in_stock: boolean;
    stock: number | null;
    rating_avg: number | null;
    rating_count: number;
    attrs: Record<string, unknown>;
    description_en: string;
    description_ar: string;
    highlights_en: string[];
    images: string[];
    provenance: Record<string, unknown>;
  }>;
}

async function main(): Promise<void> {
  const catalogPath = new URL("../data/catalog/products.json", import.meta.url);

  let file: CatalogFile;
  try {
    file = JSON.parse(await readFile(catalogPath, "utf8")) as CatalogFile;
  } catch {
    console.error("data/catalog/products.json not found. Run `npm run ingest` first.");
    process.exitCode = 1;
    return;
  }

  await ensureSchema();
  console.log(`Driver: ${await driverKind()}`);

  // ---- Categories ---------------------------------------------------------
  const categoryIds = new Map<CanonicalCategory, number>();

  for (const [index, slug] of CANONICAL_CATEGORIES.entries()) {
    const labels = CATEGORY_LABELS[slug];

    // Stored as an ARRAY, not an object. JSONB does not preserve object key
    // order — it normalizes keys by length then bytes — so an object would come
    // back with the spec table shuffled into meaninglessness ("OS, NFC, Colour,
    // 5G, RAM…"). The array pins the declaration order from categories.ts,
    // which is written most-important-first.
    const attrSchema = Object.entries(CATEGORY_ATTRS[slug]).map(([key, spec]) => ({ key, ...spec }));
    const row = await queryOne<{ id: number }>(
      `INSERT INTO categories (slug, name_en, name_ar, attr_schema, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE
         SET name_en = EXCLUDED.name_en,
             name_ar = EXCLUDED.name_ar,
             attr_schema = EXCLUDED.attr_schema,
             sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [slug, labels.en, labels.ar, JSON.stringify(attrSchema), index],
    );
    if (row) categoryIds.set(slug, row.id);
  }
  console.log(`Categories: ${categoryIds.size}`);

  // ---- Products -----------------------------------------------------------
  // Replaced wholesale, inside one transaction: a failure halfway through must
  // not leave the storefront with a partial catalog.
  //
  // cart_items references products, so it is cleared explicitly rather than
  // letting ON DELETE CASCADE silently empty a live cart.
  await query("BEGIN");
  await query("DELETE FROM cart_items");
  await query("DELETE FROM products");

  let inserted = 0;
  let skipped = 0;

  for (const p of file.products) {
    const categoryId = categoryIds.get(p.category);
    if (categoryId === undefined || p.price_cents === null) {
      skipped++;
      continue;
    }

    await query(
      `INSERT INTO products (
         sku, slug, category_id, brand, model, title,
         price_cents, regular_price_cents, currency, on_sale,
         in_stock, stock, rating_avg, rating_count,
         attrs, description_en, description_ar, highlights_en, images, provenance
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10,
         $11, $12, $13, $14,
         $15, $16, $17, $18, $19, $20
       )`,
      [
        p.sku,
        p.slug,
        categoryId,
        p.brand,
        p.model,
        p.title,
        p.price_cents,
        p.regular_price_cents,
        p.currency || "EGP",
        p.on_sale,
        p.in_stock,
        p.stock,
        p.rating_avg,
        p.rating_count,
        JSON.stringify(p.attrs),
        p.description_en,
        p.description_ar,
        JSON.stringify(p.highlights_en),
        JSON.stringify(p.images),
        JSON.stringify(p.provenance),
      ],
    );
    inserted++;
  }

  await query("COMMIT");
  console.log(`Products: ${inserted} inserted${skipped > 0 ? `, ${skipped} skipped (no price)` : ""}`);

  // ---- Verify the indexes actually do something ---------------------------
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
