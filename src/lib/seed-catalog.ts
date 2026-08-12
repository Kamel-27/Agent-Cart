/**
 * Shared catalog-seeding logic.
 *
 * Used by two entry points that must never open the database independently at
 * the same time: the CLI (`scripts/seed.ts`, via `npm run seed`) and, in dev,
 * an in-process trigger through the already-running Next.js server (see
 * src/app/api/admin/reseed/route.ts) — PGlite is a single-writer, file-backed
 * store, so a second OS process opening it while the dev server holds it open
 * aborts. Routing the reseed through the live server's own cached connection
 * (src/db/client.ts's `globalForDb`) avoids that entirely.
 */

import { readFile } from "node:fs/promises";
import { ensureSchema, query, queryOne } from "@/db/client";
import { CANONICAL_CATEGORIES, CATEGORY_ATTRS, CATEGORY_LABELS, type CanonicalCategory } from "@/catalog/categories";

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

export async function seedCatalog(catalogJsonPath: URL | string): Promise<{ inserted: number; skipped: number }> {
  const file = JSON.parse(await readFile(catalogJsonPath, "utf8")) as CatalogFile;

  await ensureSchema();

  const categoryIds = new Map<CanonicalCategory, number>();
  for (const [index, slug] of CANONICAL_CATEGORIES.entries()) {
    const labels = CATEGORY_LABELS[slug];
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
       )
       ON CONFLICT (sku) DO UPDATE SET
         slug = EXCLUDED.slug,
         category_id = EXCLUDED.category_id,
         brand = EXCLUDED.brand,
         model = EXCLUDED.model,
         title = EXCLUDED.title,
         price_cents = EXCLUDED.price_cents,
         regular_price_cents = EXCLUDED.regular_price_cents,
         currency = EXCLUDED.currency,
         on_sale = EXCLUDED.on_sale,
         in_stock = EXCLUDED.in_stock,
         stock = EXCLUDED.stock,
         rating_avg = EXCLUDED.rating_avg,
         rating_count = EXCLUDED.rating_count,
         attrs = EXCLUDED.attrs,
         description_en = EXCLUDED.description_en,
         description_ar = EXCLUDED.description_ar,
         highlights_en = EXCLUDED.highlights_en,
         images = EXCLUDED.images,
         provenance = EXCLUDED.provenance`,
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
  return { inserted, skipped };
}
