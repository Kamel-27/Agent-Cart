/**
 * Real-data enrichment for the home page's featured smartphones.
 *
 * Scope: the ~16 SKUs actually shown on the home page (best-selling + newest,
 * see scripts/inspect-landing-phones.ts), covering 7 distinct models. Every
 * spec below was verified against GSMArena and the manufacturer's own spec
 * page (see the `source` comment per model); every image is an official
 * product photo downloaded from the manufacturer's site or an authorised
 * reseller, saved under public/images/products/.
 *
 * This intentionally does NOT touch the other ~240 catalog SKUs — those keep
 * whatever heuristically-guessed attrs the ingestion pipeline gave them and
 * their placeholder image. Run `npm run seed` after this to load the result.
 */

import { readFile, writeFile } from "node:fs/promises";

interface CatalogProduct {
  sku: string;
  attrs: Record<string, unknown>;
  images: string[];
}

interface ModelFacts {
  // GSMArena + manufacturer spec page, cross-checked August 2026.
  source: string;
  attrs: Record<string, unknown>;
  /** Fallback image when a SKU doesn't specify its own color-matched photo. */
  image?: string;
}

const MODELS: Record<string, ModelFacts> = {
  "infinix-smart-10": {
    source: "https://m.gsmarena.com/infinix_smart_10-13933.php + https://my.infinixmobility.com/specs/smart-10",
    attrs: {
      screen_in: 6.67,
      display_type: "IPS LCD",
      refresh_hz: 120,
      battery_mah: 5000,
      charging_w: 15,
      chipset: "Unisoc T7250",
      rear_camera_mp: 8,
      front_camera_mp: 8,
      has_5g: false,
      dual_sim: true,
      nfc: true,
      os: "Android",
    },
    image: "/images/products/infinix-smart-10.webp",
  },
  "infinix-smart-20": {
    source: "https://www.gizmochina.com/2026/02/25/infinix-smart-20-launch-specifications-features/ + https://infinixmobiles.in/products/smart-20",
    attrs: {
      screen_in: 6.78,
      display_type: "IPS LCD",
      refresh_hz: 120,
      battery_mah: 5200,
      charging_w: 15,
      chipset: "MediaTek Helio G81 Ultimate",
      rear_camera_mp: 8,
      front_camera_mp: 8,
      has_5g: false,
      dual_sim: true,
      nfc: true,
      os: "Android",
    },
    image: "/images/products/infinix-smart-20.webp",
  },
  "samsung-galaxy-a07": {
    source: "https://www.gsmarena.com/samsung_galaxy_a07_5g-14409.php + https://www.samsung.com/in/smartphones/galaxy-a/galaxy-a07-black-64gb-sm-a075fzkdins/",
    attrs: {
      screen_in: 6.7,
      display_type: "PLS LCD",
      refresh_hz: 120,
      battery_mah: 6000,
      charging_w: 25,
      chipset: "MediaTek Dimensity 6300",
      rear_camera_mp: 50,
      front_camera_mp: 8,
      has_5g: true,
      dual_sim: true,
      nfc: true,
      os: "Android",
    },
    image: "/images/products/samsung-galaxy-a07.png",
  },
  "samsung-galaxy-a17": {
    source: "https://www.samsung.com/us/smartphones/galaxy-a17-5g/ + https://m.gsmarena.com/samsung_galaxy_a17_5g-14041.php",
    attrs: {
      screen_in: 6.7,
      display_type: "Super AMOLED",
      refresh_hz: 90,
      battery_mah: 5000,
      charging_w: 25,
      chipset: "Exynos 1330",
      rear_camera_mp: 50,
      front_camera_mp: 13,
      has_5g: true,
      dual_sim: true,
      nfc: true,
      os: "Android",
    },
    image: "/images/products/samsung-galaxy-a17.png",
  },
  "apple-iphone-16": {
    source: "https://www.apple.com/iphone-16/specs/",
    attrs: {
      screen_in: 6.1,
      display_type: "Super Retina XDR OLED",
      refresh_hz: 60,
      battery_mah: 3561,
      charging_w: 25,
      chipset: "Apple A18",
      rear_camera_mp: 48,
      front_camera_mp: 12,
      has_5g: true,
      dual_sim: true,
      nfc: true,
      os: "iOS",
    },
  },
  "apple-iphone-17-pro": {
    source: "https://www.apple.com/iphone-17-pro/specs/",
    attrs: {
      screen_in: 6.3,
      display_type: "LTPO Super Retina XDR OLED",
      refresh_hz: 120,
      battery_mah: 3988,
      charging_w: 40,
      chipset: "Apple A19 Pro",
      rear_camera_mp: 48,
      front_camera_mp: 18,
      has_5g: true,
      dual_sim: true,
      nfc: true,
      os: "iOS",
    },
    image: "/images/products/apple-iphone-17-pro-orange.jpg",
  },
  "apple-iphone-17": {
    source: "https://www.apple.com/iphone-17/specs/",
    attrs: {
      screen_in: 6.3,
      display_type: "LTPO Super Retina XDR OLED",
      refresh_hz: 120,
      battery_mah: 3692,
      charging_w: 25,
      chipset: "Apple A19",
      rear_camera_mp: 48,
      front_camera_mp: 18,
      has_5g: true,
      dual_sim: true,
      nfc: true,
      os: "iOS",
    },
  },
};

// sku -> { model key into MODELS, optional per-SKU image/color override }
const SKU_MODEL: Record<string, { model: string; image?: string; color?: string }> = {
  "INF-PH-5207": { model: "infinix-smart-10", color: "Twilight Gold" },
  "INF-PH-5202": { model: "infinix-smart-10", color: "Iris Blue" },
  "INF-PH-5195": { model: "infinix-smart-10", color: "Titanium Silver" },
  "INF-PH-5189": { model: "infinix-smart-10", color: "Sleek Black" },
  "INF-PH-7523": { model: "infinix-smart-20" },
  "INF-PH-7513": { model: "infinix-smart-20" },
  "INF-PH-7504": { model: "infinix-smart-20" },
  "SAM-PH-7618": { model: "samsung-galaxy-a07" },
  "SAM-PH-4366": { model: "samsung-galaxy-a07" },
  "SAM-PH-4358": { model: "samsung-galaxy-a17" },
  "APP-PH-4207": { model: "apple-iphone-16", image: "/images/products/apple-iphone-16-pink.jpg", color: "Pink" },
  "APP-PH-4214": { model: "apple-iphone-16", image: "/images/products/apple-iphone-16-white.jpg", color: "White" },
  "APP-PH-4267": { model: "apple-iphone-17", image: "/images/products/apple-iphone-17-white.jpg", color: "White" },
  "APP-PH-4274": { model: "apple-iphone-17", image: "/images/products/apple-iphone-17-blue.jpg", color: "Mist Blue" },
  "APP-PH-4288": { model: "apple-iphone-17", image: "/images/products/apple-iphone-17-green.jpg", color: "Sage" },
  "APP-PH-4331": { model: "apple-iphone-17-pro", color: "Cosmic Orange" },
};

async function main(): Promise<void> {
  const catalogPath = new URL("../data/catalog/products.json", import.meta.url);
  const data = JSON.parse(await readFile(catalogPath, "utf8")) as { products: CatalogProduct[] };

  let updated = 0;
  for (const product of data.products) {
    const mapping = SKU_MODEL[product.sku];
    if (!mapping) continue;
    const facts = MODELS[mapping.model]!;

    product.attrs = { ...product.attrs, ...facts.attrs };
    if (mapping.color) product.attrs.color = mapping.color;
    product.images = [mapping.image ?? facts.image!];
    updated++;
  }

  if (updated !== Object.keys(SKU_MODEL).length) {
    console.warn(`Expected to update ${Object.keys(SKU_MODEL).length} SKUs, actually updated ${updated}. Some SKUs may no longer exist in the catalog.`);
  }

  await writeFile(catalogPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Enriched ${updated} featured SKUs with real, sourced specs and official photos.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
