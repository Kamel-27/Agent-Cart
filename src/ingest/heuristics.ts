/**
 * Deterministic attribute extraction — runs before the model and takes priority
 * over it.
 *
 * Two sources, in order of trust:
 *
 *   1. WooCommerce product attributes (`pa_ram`, `pa_storage`, `pa_color`).
 *      These are curated dropdown terms, so when present they are authoritative.
 *      They are populated inconsistently — some products have all three, some
 *      have only colour, some have none — hence step 2.
 *
 *   2. Title regexes. Phone titles in this catalog are highly structured
 *      ("Realme 15 Dual SIM – 256GB, 12GB RAM, 5G – Titanium"), so storage, RAM,
 *      network, and SIM count parse out reliably.
 *
 * Anything these two cannot resolve is left for the model. Doing it in this
 * order means the model is never asked to guess something we already know, which
 * is both cheaper and less error-prone.
 */

import type { SourceProduct } from "./source.js";
import { cleanTitle } from "./html.js";
import { brandFromSource, type CanonicalCategory } from "../catalog/categories.js";

export type AttrValue = string | number | boolean | null;
export type Attrs = Record<string, AttrValue>;

export interface HeuristicResult {
  attrs: Attrs;
  /** Which keys came from heuristics — the model is told not to contradict these. */
  locked: string[];
  brand: string | null;
  model: string | null;
}

const SIZE_RE = /(\d+(?:\.\d+)?)\s*(TB|GB|MB)\b/gi;

function toGb(value: number, unit: string): number | null {
  switch (unit.toUpperCase()) {
    case "TB":
      return Math.round(value * 1024);
    case "GB":
      return Math.round(value);
    case "MB":
      return value >= 512 ? Math.round(value / 1024) : null;
    default:
      return null;
  }
}

/**
 * Storage and RAM from a title.
 *
 * These titles interleave the two figures in either order and with no consistent
 * separator — "256GB, 12GB RAM", "8GB RAM - 256GB", "6GB RAM, 128GB". A
 * proximity window around each size is not good enough: in "128GB, 6GB Ram" the
 * word "Ram" sits close to BOTH figures, and tagging the storage value as RAM
 * loses the storage value entirely.
 *
 * So: match the RAM token together with its own number, remove that span from
 * the string, and treat whatever size figures remain as storage candidates.
 */
function parseSizes(title: string): { storage_gb: number | null; ram_gb: number | null } {
  // Either "12GB RAM" or "RAM: 12GB".
  const RAM_RE =
    /(?:(\d+(?:\.\d+)?)\s*(TB|GB|MB)\s*(?:of\s+)?(?:ram|memory)\b)|(?:\b(?:ram|memory)\s*:?\s*(\d+(?:\.\d+)?)\s*(TB|GB|MB))/i;

  let ram: number | null = null;
  let remainder = title;

  const match = RAM_RE.exec(title);
  if (match) {
    const rawValue = match[1] ?? match[3];
    const unit = match[2] ?? match[4];
    if (rawValue && unit) ram = toGb(Number.parseFloat(rawValue), unit);
    remainder = `${title.slice(0, match.index)} ${title.slice(match.index + match[0].length)}`;
  }

  const remaining = [...remainder.matchAll(SIZE_RE)]
    .map((m) => (m[1] && m[2] ? toGb(Number.parseFloat(m[1]), m[2]) : null))
    .filter((n): n is number => n !== null);

  let storage: number | null = null;

  if (ram !== null) {
    // Storage is the largest remaining figure.
    storage = remaining.length > 0 ? Math.max(...remaining) : null;
  } else if (remaining.length >= 2) {
    // No RAM marker at all ("8GB / 256GB"): smaller is RAM by convention, but
    // only when it is small enough to plausibly be RAM.
    const sorted = [...remaining].sort((a, b) => a - b);
    const small = sorted[0];
    const large = sorted[sorted.length - 1];
    if (small !== undefined && large !== undefined && small <= 32 && large > small) {
      ram = small;
      storage = large;
    } else {
      storage = large ?? null;
    }
  } else {
    storage = remaining[0] ?? null;
  }

  return { storage_gb: storage, ram_gb: ram };
}

/** Read a WooCommerce attribute term by taxonomy name. */
function termValue(product: SourceProduct, taxonomy: string): string | null {
  const attr = product.attributes.find((a) => a.taxonomy === taxonomy);
  if (!attr || attr.terms.length === 0) return null;
  // For variable products prefer the flagged default, else the first term.
  const term = attr.terms.find((t) => t.default) ?? attr.terms[0];
  return term?.name ?? null;
}

function parseAttrSize(raw: string | null): number | null {
  if (!raw) return null;
  const match = /(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i.exec(raw);
  if (!match?.[1] || !match[2]) return null;
  return toGb(Number.parseFloat(match[1]), match[2]);
}

/** Strip the spec noise off a title to leave something model-name-shaped. */
function parseModel(title: string, brand: string | null): string | null {
  let text = title;

  // Everything after the first dash is usually spec listing, not the model.
  const dash = text.indexOf(" – ");
  if (dash > 0) text = text.slice(0, dash);

  text = text
    .replace(SIZE_RE, " ")
    .replace(/\b(dual|single|nano|e)[\s-]?sim\b/gi, " ")
    .replace(/\b[45]G\b/gi, " ")
    .replace(/\bram\b/gi, " ")
    .replace(/[,\-–—]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (brand) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`^${escaped}\\s+`, "i"), "").trim();
  }

  return text.length >= 2 ? text : null;
}

export function runHeuristics(product: SourceProduct, category: CanonicalCategory): HeuristicResult {
  const title = cleanTitle(product.name);
  const slugs = product.categories.map((c) => c.slug);
  const attrs: Attrs = {};
  const locked: string[] = [];

  const set = (key: string, value: AttrValue): void => {
    if (value === null || value === undefined) return;
    attrs[key] = value;
    locked.push(key);
  };

  // ---- Layer 1: curated WooCommerce attributes -----------------------------
  const colorTerm = termValue(product, "pa_color");
  const ramTerm = parseAttrSize(termValue(product, "pa_ram"));
  const storageTerm = parseAttrSize(termValue(product, "pa_storage"));

  if (category === "smartphones" || category === "tablets") {
    set("ram_gb", ramTerm);
    set("storage_gb", storageTerm);
  }
  set("color", colorTerm);

  // ---- Layer 2: title parsing ---------------------------------------------
  if (category === "smartphones" || category === "tablets") {
    const sizes = parseSizes(title);
    if (attrs.ram_gb === undefined) set("ram_gb", sizes.ram_gb);
    if (attrs.storage_gb === undefined) set("storage_gb", sizes.storage_gb);
  }

  if (category === "smartphones") {
    if (/\b5G\b/i.test(title)) set("has_5g", true);
    else if (/\b4G\b/i.test(title)) set("has_5g", false);

    if (/\bdual\s*-?\s*sim\b/i.test(title)) set("dual_sim", true);
    else if (/\bsingle\s*-?\s*sim\b/i.test(title)) set("dual_sim", false);
  }

  if (category === "tvs") {
    const inches = /(\d{2,3})\s*(?:inch|"|”)/i.exec(title);
    if (inches?.[1]) set("screen_in", Number.parseInt(inches[1], 10));
    if (/\b8K\b/i.test(title)) set("resolution", "8K UHD");
    else if (/\b4K\b|\bUHD\b/i.test(title)) set("resolution", "4K UHD");
  }

  if (category === "powerbanks") {
    const mah = /(\d{4,6})\s*mah/i.exec(title);
    if (mah?.[1]) set("capacity_mah", Number.parseInt(mah[1], 10));
  }

  // ---- Brand and model ----------------------------------------------------
  const brand =
    brandFromSource(slugs) ??
    product.brands?.[0]?.name ??
    title.split(/\s+/)[0] ??
    null;

  return { attrs, locked, brand, model: parseModel(title, brand) };
}
