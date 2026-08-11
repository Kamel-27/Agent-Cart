/**
 * Stage 1 — pull the source catalog to disk, unmodified.
 *
 * Kept as a separate stage so that extraction can be re-run and tuned dozens of
 * times without touching the source site again. `data/raw/` is gitignored.
 *
 *   npm run fetch
 */

import { mkdir, writeFile } from "node:fs/promises";
import { StoreApiClient } from "../src/ingest/source.js";
import { loadEnv } from "../src/ingest/env.js";

const env = loadEnv();
const RAW_DIR = new URL("../data/raw/", import.meta.url);

async function main(): Promise<void> {
  await mkdir(RAW_DIR, { recursive: true });

  const client = new StoreApiClient(env.SOURCE_BASE_URL);

  process.stdout.write("Fetching category taxonomy… ");
  const categories = await client.fetchCategories();
  console.log(`${categories.length} categories`);

  console.log("Fetching products…");
  const interactive = process.stdout.isTTY === true;
  let lastLine = 0;
  const products = await client.fetchAllProducts((fetched, total) => {
    const line = `  ${fetched}/${total}`;
    if (interactive) {
      process.stdout.write(`\r${line}${" ".repeat(Math.max(0, lastLine - line.length))}`);
      lastLine = line.length;
    } else {
      console.log(line);
    }
  });
  if (interactive) process.stdout.write("\n");

  const fetchedAt = new Date().toISOString();

  await writeFile(
    new URL("categories.json", RAW_DIR),
    JSON.stringify({ fetched_at: fetchedAt, source: env.SOURCE_BASE_URL, categories }, null, 2),
    "utf8",
  );

  await writeFile(
    new URL("products.json", RAW_DIR),
    JSON.stringify({ fetched_at: fetchedAt, source: env.SOURCE_BASE_URL, products }, null, 2),
    "utf8",
  );

  const withoutDescription = products.filter((p) => !p.short_description && !p.description).length;
  const variable = products.filter((p) => p.type === "variable").length;

  console.log(`\nWrote ${products.length} products to data/raw/products.json`);
  console.log(`  variable products : ${variable}`);
  console.log(`  no source text    : ${withoutDescription} (these will extract from title only)`);
  console.log(`\nNext: npm run build:catalog`);
}

main().catch((error: unknown) => {
  console.error("\nFetch failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
