/**
 * Canonical category definitions.
 *
 * These are OUR categories, not the source's. The source taxonomy is a flat-ish
 * WooCommerce tree where the leaf is usually a brand ("realme", "infinix-mobile")
 * rather than a product type, so `mapSourceCategory` resolves leaves to the
 * canonical type and `brandFromSource` pulls the brand out separately.
 *
 * Deliberately different attribute shapes per category: comparison tables are
 * only interesting when the columns actually differ, and a schema that is the
 * same everywhere is a schema that isn't doing any work.
 */

import type { AttrSpecMap } from "./spec.js";

export const CANONICAL_CATEGORIES = [
  "smartphones",
  "tablets",
  "earbuds",
  "smartwatches",
  "powerbanks",
  "tvs",
  "gaming",
  "accessories",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

/** Display names. Arabic is the primary shopping language for this market. */
export const CATEGORY_LABELS: Record<CanonicalCategory, { en: string; ar: string }> = {
  smartphones: { en: "Smartphones", ar: "موبايلات" },
  tablets: { en: "Tablets", ar: "تابلت" },
  earbuds: { en: "Earbuds", ar: "سماعات" },
  smartwatches: { en: "Smartwatches", ar: "ساعات ذكية" },
  powerbanks: { en: "Power Banks", ar: "باور بانك" },
  tvs: { en: "TVs", ar: "شاشات" },
  gaming: { en: "Gaming", ar: "جيمنج" },
  accessories: { en: "Accessories", ar: "إكسسوارات" },
};

const WATER_RESISTANCE = ["none", "IPX4", "IPX5", "IPX7", "IPX8", "IP53", "IP54", "IP67", "IP68"] as const;

export const CATEGORY_ATTRS: Record<CanonicalCategory, AttrSpecMap> = {
  smartphones: {
    storage_gb: { kind: "number", integer: true, unit: "GB", min: 8, max: 2048, desc: "Internal storage capacity" },
    ram_gb: { kind: "number", integer: true, unit: "GB", min: 1, max: 32, desc: "RAM, excluding any 'virtual'/'extended' RAM the marketing copy adds" },
    screen_in: { kind: "number", unit: "inches", min: 3, max: 8, desc: "Display diagonal" },
    display_type: { kind: "enum", values: ["AMOLED", "OLED", "IPS LCD", "TFT LCD", "LTPO AMOLED"], desc: "Display panel technology" },
    refresh_hz: { kind: "number", integer: true, unit: "Hz", min: 60, max: 240, desc: "Maximum display refresh rate" },
    battery_mah: { kind: "number", integer: true, unit: "mAh", min: 1000, max: 12000, desc: "Battery capacity" },
    charging_w: { kind: "number", integer: true, unit: "W", min: 5, max: 300, desc: "Maximum wired charging power" },
    chipset: { kind: "string", maxLength: 60, desc: "SoC name, e.g. 'Dimensity 7300+' or 'Snapdragon 8 Gen 3'" },
    rear_camera_mp: { kind: "number", unit: "MP", min: 0.3, max: 250, desc: "Main rear camera resolution; ignore secondary lenses" },
    front_camera_mp: { kind: "number", unit: "MP", min: 0.3, max: 100, desc: "Front camera resolution" },
    has_5g: { kind: "boolean", desc: "Supports 5G networks" },
    dual_sim: { kind: "boolean", desc: "Accepts two SIMs (physical or eSIM)" },
    nfc: { kind: "boolean", desc: "Has NFC" },
    os: { kind: "enum", values: ["Android", "iOS", "HarmonyOS"], desc: "Operating system" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  tablets: {
    storage_gb: { kind: "number", integer: true, unit: "GB", min: 8, max: 2048, desc: "Internal storage capacity" },
    ram_gb: { kind: "number", integer: true, unit: "GB", min: 1, max: 32, desc: "RAM" },
    screen_in: { kind: "number", unit: "inches", min: 6, max: 15, desc: "Display diagonal" },
    display_type: { kind: "enum", values: ["AMOLED", "OLED", "IPS LCD", "TFT LCD", "Liquid Retina"], desc: "Display panel technology" },
    refresh_hz: { kind: "number", integer: true, unit: "Hz", min: 60, max: 240, desc: "Maximum display refresh rate" },
    battery_mah: { kind: "number", integer: true, unit: "mAh", min: 3000, max: 15000, desc: "Battery capacity" },
    chipset: { kind: "string", maxLength: 60, desc: "SoC name" },
    has_cellular: { kind: "boolean", desc: "Has a cellular modem (not Wi-Fi only)" },
    stylus_support: { kind: "boolean", desc: "Supports an active stylus" },
    os: { kind: "enum", values: ["Android", "iPadOS", "HarmonyOS"], desc: "Operating system" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  earbuds: {
    form_factor: { kind: "enum", values: ["in-ear", "half-in-ear", "over-ear", "on-ear", "open-ear"], desc: "Physical fit style" },
    anc: { kind: "boolean", desc: "Active noise cancellation (not merely passive isolation)" },
    playback_h: { kind: "number", unit: "hours", min: 1, max: 100, desc: "Playback time on the buds alone, without the case" },
    case_total_h: { kind: "number", unit: "hours", min: 1, max: 200, desc: "Total playback including case recharges" },
    driver_mm: { kind: "number", unit: "mm", min: 5, max: 60, desc: "Driver diameter" },
    bluetooth_version: { kind: "string", maxLength: 10, desc: "Bluetooth version, e.g. '5.3'" },
    water_resistance: { kind: "enum", values: WATER_RESISTANCE, desc: "Ingress protection rating" },
    wireless_charging: { kind: "boolean", desc: "Case supports wireless charging" },
    mic_count: { kind: "number", integer: true, min: 1, max: 8, desc: "Number of microphones" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  smartwatches: {
    screen_in: { kind: "number", unit: "inches", min: 0.8, max: 3, desc: "Display diagonal" },
    display_type: { kind: "enum", values: ["AMOLED", "OLED", "IPS LCD", "TFT LCD"], desc: "Display panel technology" },
    case_mm: { kind: "number", unit: "mm", min: 20, max: 60, desc: "Case width" },
    battery_days: { kind: "number", unit: "days", min: 0.5, max: 60, desc: "Typical-use battery life" },
    water_resistance: { kind: "enum", values: WATER_RESISTANCE, desc: "Ingress protection rating" },
    gps: { kind: "boolean", desc: "Has built-in GPS (not phone-tethered GPS)" },
    bluetooth_calling: { kind: "boolean", desc: "Can take calls directly on the watch" },
    heart_rate: { kind: "boolean", desc: "Has a heart-rate sensor" },
    spo2: { kind: "boolean", desc: "Has blood-oxygen measurement" },
    strap_material: { kind: "string", maxLength: 40, desc: "Strap material, e.g. 'silicone'" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  powerbanks: {
    capacity_mah: { kind: "number", integer: true, unit: "mAh", min: 1000, max: 100000, desc: "Rated capacity" },
    output_w: { kind: "number", unit: "W", min: 1, max: 300, desc: "Maximum total output power" },
    input_w: { kind: "number", unit: "W", min: 1, max: 300, desc: "Maximum input (recharge) power" },
    port_count: { kind: "number", integer: true, min: 1, max: 8, desc: "Number of output ports" },
    usb_c_pd: { kind: "boolean", desc: "Supports USB-C Power Delivery" },
    wireless_output: { kind: "boolean", desc: "Can charge devices wirelessly" },
    built_in_cable: { kind: "boolean", desc: "Has an integrated cable" },
    weight_g: { kind: "number", unit: "grams", min: 20, max: 3000, desc: "Weight" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  tvs: {
    screen_in: { kind: "number", integer: true, unit: "inches", min: 20, max: 120, desc: "Screen diagonal" },
    resolution: { kind: "enum", values: ["HD", "Full HD", "4K UHD", "8K UHD"], desc: "Native panel resolution" },
    panel_type: { kind: "enum", values: ["LED", "QLED", "OLED", "Neo QLED", "Crystal UHD"], desc: "Panel technology" },
    refresh_hz: { kind: "number", integer: true, unit: "Hz", min: 50, max: 240, desc: "Native panel refresh rate, not an interpolated 'motion rate'" },
    smart_os: { kind: "string", maxLength: 40, desc: "Smart TV platform, e.g. 'Tizen'" },
    hdr: { kind: "boolean", desc: "Supports HDR" },
    hdmi_ports: { kind: "number", integer: true, min: 0, max: 8, desc: "Number of HDMI inputs" },
  },

  gaming: {
    device_type: { kind: "enum", values: ["console", "mouse", "keyboard", "headset", "controller", "chair", "other"], desc: "What kind of gaming product this is" },
    connectivity: { kind: "enum", values: ["wired", "wireless", "both"], desc: "How it connects" },
    dpi: { kind: "number", integer: true, min: 100, max: 60000, desc: "Maximum sensor DPI (mice only)" },
    button_count: { kind: "number", integer: true, min: 1, max: 30, desc: "Number of buttons (mice/controllers only)" },
    rgb: { kind: "boolean", desc: "Has RGB lighting" },
    weight_g: { kind: "number", unit: "grams", min: 20, max: 20000, desc: "Weight" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },

  accessories: {
    accessory_type: { kind: "string", maxLength: 40, desc: "What the accessory is, e.g. 'case', 'charger', 'cable', 'screen protector'" },
    compatible_with: { kind: "string", maxLength: 80, desc: "Device or family it fits, e.g. 'iPhone 15 Pro'" },
    material: { kind: "string", maxLength: 40, desc: "Primary material" },
    length_m: { kind: "number", unit: "metres", min: 0.1, max: 10, desc: "Cable length, if it is a cable" },
    output_w: { kind: "number", unit: "W", min: 1, max: 300, desc: "Power output, if it is a charger" },
    color: { kind: "string", maxLength: 40, desc: "Colour of this specific variant" },
  },
};

/**
 * Source leaf slug -> canonical category.
 * Checked most-specific first, because a product carries both "realme" and
 * (implicitly) "mobile", and the brand leaf is the more informative one.
 */
const SOURCE_CATEGORY_MAP: ReadonlyArray<readonly [string, CanonicalCategory]> = [
  ["air-buds", "earbuds"],
  ["smart-watches-mobile", "smartwatches"],
  ["powerbanks", "powerbanks"],
  ["samsung-tvs", "tvs"],
  ["tvs", "tvs"],
  ["ipad-apple-tablets", "tablets"],
  ["android-tablets", "tablets"],
  ["tablet", "tablets"],
  ["mouse", "gaming"],
  ["play-station", "gaming"],
  ["gaming", "gaming"],
  // Brand leaves under "mobile".
  ["infinix-mobile", "smartphones"],
  ["xiaomi", "smartphones"],
  ["realme", "smartphones"],
  ["honor", "smartphones"],
  ["samsung", "smartphones"],
  ["apple", "smartphones"],
  ["vivo", "smartphones"],
  ["oppo", "smartphones"],
  ["huawei", "smartphones"],
  ["mobile", "smartphones"],
  ["accessories", "accessories"],
];

/** Brand names for source leaves that encode a brand. */
const SOURCE_BRAND_MAP: Readonly<Record<string, string>> = {
  "infinix-mobile": "Infinix",
  xiaomi: "Xiaomi",
  realme: "Realme",
  honor: "Honor",
  samsung: "Samsung",
  "samsung-tvs": "Samsung",
  apple: "Apple",
  "ipad-apple-tablets": "Apple",
  vivo: "Vivo",
  oppo: "Oppo",
  huawei: "Huawei",
  "play-station": "Sony",
};

export function mapSourceCategory(slugs: readonly string[]): CanonicalCategory {
  const present = new Set(slugs);
  for (const [slug, canonical] of SOURCE_CATEGORY_MAP) {
    if (present.has(slug)) return canonical;
  }
  return "accessories";
}

/** Brand from the source taxonomy, if the taxonomy encodes one. */
export function brandFromSource(slugs: readonly string[]): string | null {
  for (const slug of slugs) {
    const brand = SOURCE_BRAND_MAP[slug];
    if (brand) return brand;
  }
  return null;
}
