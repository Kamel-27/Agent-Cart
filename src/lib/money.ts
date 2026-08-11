/**
 * Money.
 *
 * Prices are integer minor units (EGP piastres) everywhere — in the database, in
 * the cart, in the order snapshot. They are converted to a decimal exactly once,
 * here, at the moment of display. No arithmetic is ever done on the converted
 * value, which is the only reliable way to avoid the classic float rounding bug
 * where a cart of three items totals 0.01 less than the sum of its lines.
 */

import type { Locale } from "./i18n";

const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(locale: Locale, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency,
      // Egyptian retail prices are whole pounds in practice; trailing ".00" on
      // every price is noise on a listing page.
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    FORMATTERS.set(key, cached);
  }
  return cached;
}

export function formatMoney(minorUnits: number, locale: Locale, currency = "EGP"): string {
  return formatter(locale, currency).format(minorUnits / 100);
}

/** Discount percentage, rounded. Returns null when there is no genuine saving. */
export function discountPercent(priceCents: number, regularPriceCents: number | null): number | null {
  if (regularPriceCents === null || regularPriceCents <= priceCents) return null;
  const percent = Math.round(((regularPriceCents - priceCents) / regularPriceCents) * 100);
  return percent > 0 ? percent : null;
}
