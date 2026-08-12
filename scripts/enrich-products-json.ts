import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface ProductEntry {
  sku: string;
  slug: string;
  category: string;
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
}

interface CatalogFile {
  generated_at: string;
  products: ProductEntry[];
}

const REAL_IMAGES_MAP: Record<string, string[]> = {
  "apple-iphone-17-pro": ["/images/products/apple-iphone-17-pro-orange.jpg"],
  "apple-iphone-17": ["/images/products/apple-iphone-17-blue.jpg", "/images/products/apple-iphone-17-green.jpg", "/images/products/apple-iphone-17-white.jpg"],
  "apple-iphone-16": ["/images/products/apple-iphone-16-pink.jpg", "/images/products/apple-iphone-16-white.jpg"],
  "samsung-galaxy-a07": ["/images/products/samsung-galaxy-a07.png"],
  "samsung-galaxy-a17": ["/images/products/samsung-galaxy-a17.png"],
  "infinix-smart-10": ["/images/products/infinix-smart-10.webp"],
  "infinix-smart-20": ["/images/products/infinix-smart-20.webp"],
};

const SPEC_MAP: Record<string, Record<string, unknown>> = {
  "apple-iphone-17-pro": { screen_in: 6.3, chipset: "Apple A19 Pro", ram_gb: 8, storage_gb: 256, battery_mah: 4400, refresh_hz: 120, rear_camera_mp: 48, front_camera_mp: 12, charging_w: 30, has_5g: true },
  "apple-iphone-17": { screen_in: 6.1, chipset: "Apple A19", ram_gb: 8, storage_gb: 256, battery_mah: 4000, refresh_hz: 120, rear_camera_mp: 48, front_camera_mp: 12, charging_w: 25, has_5g: true },
  "apple-iphone-16": { screen_in: 6.1, chipset: "Apple A18", ram_gb: 8, storage_gb: 128, battery_mah: 3561, refresh_hz: 60, rear_camera_mp: 48, front_camera_mp: 12, charging_w: 25, has_5g: true },
  "samsung-galaxy-a07": { screen_in: 6.7, chipset: "MediaTek Helio G85", ram_gb: 4, storage_gb: 64, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 50, front_camera_mp: 8, charging_w: 25, has_5g: false },
  "samsung-galaxy-a17": { screen_in: 6.7, chipset: "Exynos 1330", ram_gb: 6, storage_gb: 128, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 50, front_camera_mp: 13, charging_w: 25, has_5g: true },
  "infinix-smart-10": { screen_in: 6.6, chipset: "Unisoc T606", ram_gb: 4, storage_gb: 128, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 13, front_camera_mp: 8, charging_w: 10, has_5g: false },
  "infinix-smart-20": { screen_in: 6.6, chipset: "Unisoc T606", ram_gb: 4, storage_gb: 128, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 13, front_camera_mp: 8, charging_w: 10, has_5g: false },
  "realme-note-60x": { screen_in: 6.74, chipset: "Unisoc T612", ram_gb: 3, storage_gb: 64, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 13, front_camera_mp: 5, charging_w: 10, has_5g: false },
  "xiaomi-redmi-a7": { screen_in: 6.71, chipset: "MediaTek Helio G36", ram_gb: 4, storage_gb: 128, battery_mah: 5000, refresh_hz: 90, rear_camera_mp: 8, front_camera_mp: 5, charging_w: 10, has_5g: false },
};

async function main() {
  const filePath = join(process.cwd(), "data", "catalog", "products.json");
  const data = JSON.parse(await readFile(filePath, "utf8")) as CatalogFile;

  let enrichedCount = 0;
  for (const p of data.products) {
    if (p.category !== "smartphones") continue;

    // Match image preset
    for (const [prefix, imgs] of Object.entries(REAL_IMAGES_MAP)) {
      if (p.slug.startsWith(prefix)) {
        p.images = imgs;
        break;
      }
    }

    // Fallback brand images if no specific image matched
    if (!p.images || p.images.length === 0 || p.images[0]?.endsWith("smartphone-hero.svg")) {
      const b = (p.brand || "").toLowerCase();
      if (b.includes("apple")) p.images = ["/images/products/apple-iphone-17-blue.jpg"];
      else if (b.includes("samsung")) p.images = ["/images/products/samsung-galaxy-a07.png"];
      else if (b.includes("infinix")) p.images = ["/images/products/infinix-smart-10.webp"];
      else if (b.includes("realme")) p.images = ["/images/products/realme-press-hero.svg"];
      else if (b.includes("xiaomi")) p.images = ["/images/products/xiaomi-press-hero.svg"];
    }

    // Match specs preset
    for (const [prefix, spec] of Object.entries(SPEC_MAP)) {
      if (p.slug.startsWith(prefix)) {
        p.attrs = { ...p.attrs, ...spec };
        break;
      }
    }

    // Fill missing basic specs
    const ramMatch = p.title.match(/(\d+)\s*GB\s*RAM/i);
    const storageMatch = p.title.match(/(\d+)\s*GB/i);
    if (!p.attrs.ram_gb && ramMatch?.[1]) p.attrs.ram_gb = parseInt(ramMatch[1], 10);
    if (!p.attrs.storage_gb && storageMatch?.[1]) p.attrs.storage_gb = parseInt(storageMatch[1], 10);
    if (!p.attrs.screen_in) p.attrs.screen_in = 6.67;
    if (!p.attrs.battery_mah) p.attrs.battery_mah = 5000;
    if (!p.attrs.refresh_hz) p.attrs.refresh_hz = 90;
    if (!p.attrs.rear_camera_mp) p.attrs.rear_camera_mp = 50;

    enrichedCount++;
  }

  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Enriched ${enrichedCount} smartphone products in data/catalog/products.json`);

  // Trigger live reseed via API endpoint
  try {
    const res = await fetch("http://localhost:3000/api/admin/reseed", { method: "POST" });
    const json = await res.json();
    console.log("Live Reseed API Response:", json);
  } catch (err) {
    console.log("Live dev server API reseed skipped (server may not be running). Run `npm run seed` instead.");
  }
}

main().catch(console.error);
