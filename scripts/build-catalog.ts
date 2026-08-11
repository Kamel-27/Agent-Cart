/**
 * Stage 2 — turn the raw source dump into our normalized catalog.
 *
 *   raw product
 *     -> canonical category      (categories.ts)
 *     -> heuristic attributes    (heuristics.ts, authoritative)
 *     -> model gap-fill          (extract.ts, pass A)
 *     -> fresh copy              (describe.ts, pass B — attrs only)
 *     -> validated catalog row
 *
 * Writes data/catalog/products.json plus a coverage report, because attribute
 * coverage is the number that actually predicts whether comparison and search
 * will work (docs/PLAN.md §11, obstacle 3).
 *
 *   npm run build:catalog
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "../src/ingest/env.js";
import { createLlmClient, mapWithConcurrency } from "../src/ingest/llm.js";
import { priceToMinorUnits, type SourceProduct } from "../src/ingest/source.js";
import { cleanTitle, slugify } from "../src/ingest/html.js";
import { runHeuristics, type Attrs } from "../src/ingest/heuristics.js";
import { extractAttributes } from "../src/ingest/extract.js";
import { writeDescription } from "../src/ingest/describe.js";
import {
  CANONICAL_CATEGORIES,
  CATEGORY_ATTRS,
  mapSourceCategory,
  type CanonicalCategory,
} from "../src/catalog/categories.js";

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const OUT_DIR = new URL("../data/catalog/", import.meta.url);

interface CatalogProduct {
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
  attrs: Attrs;
  description_en: string;
  description_ar: string;
  highlights_en: string[];
  /** Left empty on purpose — source imagery is not ours to publish.
   *  Fill from manufacturer press kits or your own photography. */
  images: string[];
  provenance: {
    source_id: number;
    source_url: string;
    facts_from: "elhashimstore.com (WooCommerce Store API)";
    copy_generated_by: "model" | "template";
    attrs_from_heuristics: string[];
    attrs_from_model: string[];
    extraction_error: string | null;
  };
}

async function main(): Promise<void> {
  const env = loadEnv();

  let rawFile: string;
  try {
    rawFile = await readFile(new URL("products.json", RAW_DIR), "utf8");
  } catch {
    console.error("data/raw/products.json not found. Run `npm run fetch` first.");
    process.exitCode = 1;
    return;
  }

  const { products } = JSON.parse(rawFile) as { products: SourceProduct[] };
  const llm = createLlmClient(env);

  console.log(`Building catalog from ${products.length} source products`);
  console.log(
    llm
      ? `  extraction : ${llm.provider} (${llm.model}), concurrency ${env.INGEST_CONCURRENCY}`
      : "  extraction : heuristics only (LLM_PROVIDER=none)",
  );
  console.log();

  let done = 0;
  const interactive = process.stdout.isTTY === true;
  const built = await mapWithConcurrency(products, env.INGEST_CONCURRENCY, async (product) => {
    const row = await buildProduct(product, llm);
    done++;
    // Carriage-return progress is unreadable once redirected to a file or pipe.
    if (interactive) process.stdout.write(`\r  ${done}/${products.length}   `);
    else if (done % 50 === 0 || done === products.length) console.log(`  ${done}/${products.length}`);
    return row;
  });
  process.stdout.write(interactive ? "\n\n" : "\n");

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    new URL("products.json", OUT_DIR),
    JSON.stringify({ generated_at: new Date().toISOString(), products: built }, null, 2),
    "utf8",
  );

  const report = buildCoverageReport(built);
  await writeFile(new URL("coverage.json", OUT_DIR), JSON.stringify(report, null, 2), "utf8");

  printReport(built, report);
}

async function buildProduct(
  product: SourceProduct,
  llm: ReturnType<typeof createLlmClient>,
): Promise<CatalogProduct> {
  const slugs = product.categories.map((c) => c.slug);
  const category = mapSourceCategory(slugs);
  const heuristics = runHeuristics(product, category);

  const extraction = await extractAttributes(product, category, heuristics, llm);
  const copy = await writeDescription(
    category,
    heuristics.brand,
    heuristics.model,
    extraction.attrs,
    llm,
  );

  const minorUnit = product.prices.currency_minor_unit ?? 2;
  const title = cleanTitle(product.name);

  return {
    // The source leaves `sku` empty on every product, so we mint our own.
    sku: makeSku(heuristics.brand, category, product.id),
    slug: `${slugify(title).slice(0, 60)}-${product.id}`,
    category,
    brand: heuristics.brand,
    model: heuristics.model,
    title,
    price_cents: priceToMinorUnits(product.prices.price, minorUnit),
    regular_price_cents: priceToMinorUnits(product.prices.regular_price, minorUnit),
    currency: product.prices.currency_code || "EGP",
    on_sale: product.on_sale,
    in_stock: product.is_in_stock,
    stock: product.low_stock_remaining,
    rating_avg: product.average_rating ? Number.parseFloat(product.average_rating) || null : null,
    rating_count: product.review_count ?? 0,
    attrs: extraction.attrs,
    description_en: copy.description_en,
    description_ar: copy.description_ar,
    highlights_en: copy.highlights_en,
    images: [],
    provenance: {
      source_id: product.id,
      source_url: product.permalink,
      facts_from: "elhashimstore.com (WooCommerce Store API)",
      copy_generated_by: copy.generated_by,
      attrs_from_heuristics: heuristics.locked,
      attrs_from_model: extraction.fromModel,
      extraction_error: extraction.error,
    },
  };
}

const CATEGORY_CODES: Record<CanonicalCategory, string> = {
  smartphones: "PH",
  tablets: "TB",
  earbuds: "EB",
  smartwatches: "SW",
  powerbanks: "PB",
  tvs: "TV",
  gaming: "GM",
  accessories: "AC",
};

function makeSku(brand: string | null, category: CanonicalCategory, sourceId: number): string {
  const brandCode = (brand ?? "GEN")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  return `${brandCode}-${CATEGORY_CODES[category]}-${sourceId}`;
}

interface CoverageReport {
  by_category: Record<string, { count: number; fields: Record<string, number> }>;
}

function buildCoverageReport(products: CatalogProduct[]): CoverageReport {
  const byCategory: CoverageReport["by_category"] = {};

  for (const category of CANONICAL_CATEGORIES) {
    const rows = products.filter((p) => p.category === category);
    if (rows.length === 0) continue;

    const fields: Record<string, number> = {};
    for (const key of Object.keys(CATEGORY_ATTRS[category])) {
      const filled = rows.filter((r) => r.attrs[key] !== null && r.attrs[key] !== undefined).length;
      fields[key] = Math.round((filled / rows.length) * 100);
    }
    byCategory[category] = { count: rows.length, fields };
  }

  return { by_category: byCategory };
}

function printReport(products: CatalogProduct[], report: CoverageReport): void {
  console.log(`Wrote ${products.length} products to data/catalog/products.json\n`);

  console.log("Attribute coverage (% of products with a non-null value)");
  for (const [category, data] of Object.entries(report.by_category)) {
    console.log(`\n  ${category} (${data.count})`);
    const entries = Object.entries(data.fields).sort((a, b) => b[1] - a[1]);
    for (const [field, pct] of entries) {
      const bar = "█".repeat(Math.round(pct / 5)).padEnd(20, "·");
      const flag = pct < 40 ? "  <- thin" : "";
      console.log(`    ${field.padEnd(20)} ${bar} ${String(pct).padStart(3)}%${flag}`);
    }
  }

  const failures = products.filter((p) => p.provenance.extraction_error !== null);
  const templated = products.filter((p) => p.provenance.copy_generated_by === "template");

  console.log(`\nCopy: ${products.length - templated.length} model-written, ${templated.length} templated`);
  if (failures.length > 0) {
    console.log(`Extraction issues on ${failures.length} products, e.g.:`);
    for (const p of failures.slice(0, 3)) {
      console.log(`  ${p.sku}: ${p.provenance.extraction_error}`);
    }
  }

  console.log("\nImages are intentionally empty — see docs/INGESTION.md.");
}

main().catch((error: unknown) => {
  console.error("\nBuild failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
