/**
 * WooCommerce returns titles and descriptions as HTML with entity-encoded
 * punctuation (`&#8211;` for en-dash is everywhere in this catalog). Both need
 * flattening before anything else can parse them.
 */

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  times: "×",
  deg: "°",
  trade: "™",
  reg: "®",
  copy: "©",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/**
 * Flatten HTML to plain text. Block-level tags become newlines so that the
 * spec-card markup used on the source site keeps its label/value pairing
 * instead of collapsing into one run-on line.
 */
export function htmlToText(input: string): string {
  if (!input) return "";
  return decodeEntities(
    input
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6]|section)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/t[dh]>/gi, ": ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Title text: entities decoded, whitespace collapsed, dashes normalized. */
export function cleanTitle(input: string): string {
  return decodeEntities(input)
    .replace(/\s*[–—]\s*/g, " – ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

/** URL-safe slug that tolerates Arabic by falling back to a hash-free ASCII form. */
export function slugify(input: string): string {
  const ascii = decodeEntities(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "item";
}
