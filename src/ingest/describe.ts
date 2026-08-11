/**
 * Pass B — write fresh product copy.
 *
 * This pass deliberately receives ONLY the normalized attributes produced by
 * pass A. The source title, the source description, and the source HTML are all
 * out of scope here. That separation is the whole point: a model that cannot see
 * someone else's prose cannot paraphrase it, so the generated copy is
 * demonstrably our own rather than a reworded copy of theirs.
 *
 * It also produces better copy — descriptions generated from a uniform attribute
 * set are consistent across the catalog in a way hand-written ones never are.
 */

import { z } from "zod";
import type { LlmClient } from "./llm.js";
import { withRetry } from "./llm.js";
import type { Attrs } from "./heuristics.js";
import { CATEGORY_ATTRS, type CanonicalCategory } from "../catalog/categories.js";
import type { AttrSpec } from "../catalog/spec.js";

const SYSTEM_PROMPT = `You write product descriptions for an Egyptian consumer-electronics store.

You will receive a product's category, brand, model name, and a list of verified specifications. Write original copy based on those specifications.

Rules:
- Use ONLY the specifications given. Do not add features, awards, comparisons to other products, or claims about price, availability, warranty, or shipping. If a specification is absent, it does not exist as far as you are concerned — do not speculate about it.
- Write 2 to 4 sentences. Lead with what the product is good for in practice, then the specifications that support it. A shopper should learn something a spec table alone would not tell them.
- Be direct and factual. No hype, no exclamation marks, no "unleash", "elevate", "game-changing", or "revolutionary". No second-person sales pressure.
- Do not invent scarcity, urgency, or social proof of any kind.
- Write description_ar as natural Modern Standard Arabic aimed at Egyptian shoppers. It should convey the same facts as the English, not be a word-for-word translation. Keep brand names, model names, and units in Latin script as Egyptian shoppers write them.
- highlights are 3 short noun phrases, 5 words or fewer each, drawn strictly from the given specifications.

Respond with a single JSON object and nothing else.`;

const DESCRIPTION_SCHEMA = {
  type: "object",
  properties: {
    description_en: { type: "string", description: "2-4 sentences of English copy" },
    description_ar: { type: "string", description: "2-4 sentences of Arabic copy" },
    highlights_en: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
      description: "Three short noun phrases",
    },
  },
  required: ["description_en", "description_ar", "highlights_en"],
  additionalProperties: false,
} as const;

const descriptionValidator = z.object({
  description_en: z.string().min(20).max(1200),
  description_ar: z.string().min(20).max(1200),
  highlights_en: z.array(z.string().min(2).max(60)).min(1).max(5),
});

export interface Description {
  description_en: string;
  description_ar: string;
  highlights_en: string[];
  generated_by: "model" | "template";
}

export async function writeDescription(
  category: CanonicalCategory,
  brand: string | null,
  model: string | null,
  attrs: Attrs,
  llm: LlmClient | null,
): Promise<Description> {
  const specSheet = formatSpecSheet(category, attrs);

  if (!llm || specSheet.length === 0) {
    return templateDescription(category, brand, model, attrs);
  }

  const user = [
    `Category: ${category}`,
    `Brand: ${brand ?? "unknown"}`,
    `Model: ${model ?? "unknown"}`,
    "",
    "Verified specifications:",
    specSheet.map(([label, value]) => `- ${label}: ${value}`).join("\n"),
  ].join("\n");

  try {
    const raw = await withRetry(() =>
      llm.complete({ system: SYSTEM_PROMPT, user, schema: DESCRIPTION_SCHEMA, maxTokens: 1500 }),
    );
    const parsed = descriptionValidator.safeParse(raw);
    if (parsed.success) {
      return { ...parsed.data, generated_by: "model" };
    }
  } catch {
    // Fall through to the deterministic version.
  }

  return templateDescription(category, brand, model, attrs);
}

/** Human-readable spec list, skipping nulls. */
function formatSpecSheet(category: CanonicalCategory, attrs: Attrs): Array<[string, string]> {
  const specs = CATEGORY_ATTRS[category];
  const rows: Array<[string, string]> = [];

  for (const [key, spec] of Object.entries(specs)) {
    const value = attrs[key];
    if (value === null || value === undefined) continue;
    rows.push([humanLabel(key), formatValue(value, spec)]);
  }

  return rows;
}

function humanLabel(key: string): string {
  return key
    .replace(/_(gb|mah|mm|mp|hz|in|w|g|h|ar|en)$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: Attrs[string], spec: AttrSpec): string {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" && spec.kind === "number" && spec.unit) {
    return `${value} ${spec.unit}`;
  }
  return String(value);
}

/** Boolean attributes read as capabilities, not as "dual sim of yes". */
const FEATURE_LABELS: Readonly<Record<string, { en: string; ar: string }>> = {
  has_5g: { en: "5G", ar: "شبكات 5G" },
  dual_sim: { en: "dual SIM", ar: "شريحتين" },
  nfc: { en: "NFC", ar: "NFC" },
  has_cellular: { en: "cellular data", ar: "بيانات خلوية" },
  stylus_support: { en: "stylus input", ar: "القلم الإلكتروني" },
  anc: { en: "active noise cancellation", ar: "إلغاء الضوضاء النشط" },
  wireless_charging: { en: "wireless charging", ar: "الشحن اللاسلكي" },
  gps: { en: "built-in GPS", ar: "GPS مدمج" },
  bluetooth_calling: { en: "Bluetooth calling", ar: "المكالمات عبر البلوتوث" },
  heart_rate: { en: "heart-rate tracking", ar: "قياس معدل ضربات القلب" },
  spo2: { en: "blood-oxygen tracking", ar: "قياس نسبة الأكسجين" },
  usb_c_pd: { en: "USB-C Power Delivery", ar: "USB-C Power Delivery" },
  wireless_output: { en: "wireless output", ar: "شحن لاسلكي للأجهزة" },
  built_in_cable: { en: "an integrated cable", ar: "كابل مدمج" },
  hdr: { en: "HDR", ar: "HDR" },
  rgb: { en: "RGB lighting", ar: "إضاءة RGB" },
};

/** Short labels so a terse spec list stays unambiguous ("storage 256 GB"). */
const SPEC_LABELS: Readonly<Record<string, string>> = {
  storage_gb: "storage",
  ram_gb: "RAM",
  screen_in: "screen",
  display_type: "panel",
  refresh_hz: "refresh",
  battery_mah: "battery",
  charging_w: "charging",
  chipset: "chipset",
  rear_camera_mp: "main camera",
  front_camera_mp: "front camera",
  capacity_mah: "capacity",
  output_w: "output",
  input_w: "input",
  port_count: "ports",
  case_mm: "case",
  battery_days: "battery life",
  playback_h: "playback",
  case_total_h: "total playback",
  driver_mm: "drivers",
  water_resistance: "water resistance",
  color: "finish",
};

/**
 * Deterministic fallback, used when LLM_PROVIDER=none, when a call fails, or
 * when there is nothing worth describing.
 *
 * It writes a terse, label-first spec line rather than attempting prose. Bad
 * generated marketing copy is worse than none: it reads as obviously machine-
 * written and it is the kind of text that quietly ships to production. A spec
 * line is honest about being a placeholder and is always grammatical.
 */
function templateDescription(
  category: CanonicalCategory,
  brand: string | null,
  model: string | null,
  attrs: Attrs,
): Description {
  const name = [brand, model].filter(Boolean).join(" ") || "This product";
  const specs = CATEGORY_ATTRS[category];

  const measured: string[] = [];
  const featuresEn: string[] = [];
  const featuresAr: string[] = [];

  for (const [key, spec] of Object.entries(specs)) {
    const value = attrs[key];
    if (value === null || value === undefined) continue;

    if (typeof value === "boolean") {
      if (!value) continue; // Absence of a feature is not worth a sentence.
      const label = FEATURE_LABELS[key];
      if (label) {
        featuresEn.push(label.en);
        featuresAr.push(label.ar);
      }
      continue;
    }

    const label = SPEC_LABELS[key] ?? humanLabel(key).toLowerCase();
    measured.push(`${label} ${formatValue(value, spec)}`);
  }

  const specLine = measured.slice(0, 5).join(", ");
  const featureLineEn = featuresEn.length > 0 ? ` Supports ${joinList(featuresEn)}.` : "";
  const featureLineAr = featuresAr.length > 0 ? ` يدعم ${featuresAr.join("، ")}.` : "";

  const en = specLine
    ? `${name} — ${categoryNoun(category)}. ${capitalize(specLine)}.${featureLineEn}`
    : `${name} — ${categoryNoun(category)}.`;

  const ar = specLine
    ? `${name} — ${categoryNounAr(category)}. المواصفات: ${specLine}.${featureLineAr}`
    : `${name} — ${categoryNounAr(category)}.`;

  const highlights = [...measured.slice(0, 2), ...featuresEn.slice(0, 1)].slice(0, 3);

  return {
    description_en: en,
    description_ar: ar,
    highlights_en: highlights.length > 0 ? highlights : [categoryNoun(category)],
    generated_by: "template",
  };
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const CATEGORY_NOUNS: Record<CanonicalCategory, string> = {
  smartphones: "smartphone",
  tablets: "tablet",
  earbuds: "pair of wireless earbuds",
  smartwatches: "smartwatch",
  powerbanks: "portable power bank",
  tvs: "television",
  gaming: "gaming product",
  accessories: "accessory",
};

const CATEGORY_NOUNS_AR: Record<CanonicalCategory, string> = {
  smartphones: "هاتف ذكي",
  tablets: "تابلت",
  earbuds: "سماعات لاسلكية",
  smartwatches: "ساعة ذكية",
  powerbanks: "باور بانك",
  tvs: "تليفزيون",
  gaming: "منتج جيمنج",
  accessories: "إكسسوار",
};

function categoryNoun(category: CanonicalCategory): string {
  return CATEGORY_NOUNS[category];
}

function categoryNounAr(category: CanonicalCategory): string {
  return CATEGORY_NOUNS_AR[category];
}
