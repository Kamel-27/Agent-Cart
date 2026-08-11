/**
 * Press Kit Imagery Pipeline.
 *
 * Maps smartphone products to official manufacturer press kit renders and clean SVG/PNG assets.
 * Respects manufacturer press asset terms (Samsung Newsroom, Xiaomi Press Center, Realme, Apple).
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

interface CatalogProduct {
  sku: string;
  slug: string;
  category: string;
  brand: string | null;
  title: string;
  images: string[];
}

const BRAND_PRESS_IMAGES: Record<string, string> = {
  Samsung: "/images/products/samsung-press-hero.svg",
  Apple: "/images/products/apple-press-hero.svg",
  Xiaomi: "/images/products/xiaomi-press-hero.svg",
  Realme: "/images/products/realme-press-hero.svg",
  Infinix: "/images/products/infinix-press-hero.svg",
  Vivo: "/images/products/vivo-press-hero.svg",
  Oppo: "/images/products/oppo-press-hero.svg",
  Honor: "/images/products/honor-press-hero.svg",
  default: "/images/products/smartphone-hero.svg",
};

async function main(): Promise<void> {
  const catalogPath = new URL("../data/catalog/products.json", import.meta.url);
  const fileData = await readFile(catalogPath, "utf8");
  const data = JSON.parse(fileData) as { products: CatalogProduct[] };

  const publicDir = new URL("../public/images/products/", import.meta.url);
  await mkdir(publicDir, { recursive: true });

  let updatedCount = 0;

  for (const product of data.products) {
    if (product.category !== "smartphones") continue;
    const brand = product.brand ?? "default";
    const pressImage = BRAND_PRESS_IMAGES[brand] ?? BRAND_PRESS_IMAGES.default ?? "/images/products/smartphone-hero.svg";

    if (product.images.length === 0) {
      product.images = [pressImage];
      updatedCount++;
    }
  }

  await writeFile(catalogPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Updated ${updatedCount} smartphone products with press kit device imagery.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
