import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatMoney, discountPercent } from "@/lib/money";
import { t, type Locale } from "@/lib/i18n";

/** The two or three attributes worth showing on a card, per category. */
const CARD_SPECS: Record<string, string[]> = {
  smartphones: ["storage_gb", "ram_gb", "screen_in"],
  tablets: ["storage_gb", "ram_gb", "screen_in"],
  earbuds: ["anc", "playback_h"],
  smartwatches: ["screen_in", "battery_days"],
  powerbanks: ["capacity_mah", "output_w"],
  tvs: ["screen_in", "resolution"],
  gaming: ["device_type", "connectivity"],
  accessories: ["accessory_type"],
};

const SPEC_SUFFIX: Record<string, string> = {
  storage_gb: "GB",
  ram_gb: "GB RAM",
  screen_in: '"',
  playback_h: "h",
  capacity_mah: "mAh",
  output_w: "W",
  battery_days: "d",
};

function summarize(product: ProductRow): string {
  const keys = CARD_SPECS[product.category_slug] ?? [];
  const parts: string[] = [];

  for (const key of keys) {
    const value = product.attrs[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "boolean") {
      if (value) parts.push(key.toUpperCase());
      continue;
    }
    parts.push(`${String(value)}${SPEC_SUFFIX[key] ?? ""}`);
  }

  return parts.join(" · ");
}

export function ProductCard({ product, locale }: { product: ProductRow; locale: Locale }) {
  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const specs = summarize(product);
  const image = product.images[0];

  return (
    <article className="card">
      <Link href={`/p/${product.slug}`} className="card-media">
        {/* Images are intentionally unpopulated — see docs/INGESTION.md. */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ inlineSize: "100%", blockSize: "100%", objectFit: "contain" }} />
        ) : (
          <span>{t(locale, "product.noImage")}</span>
        )}
        {discount !== null && <span className="badge badge-sale">−{discount}%</span>}
        {!product.in_stock && <span className="badge badge-out">{t(locale, "product.outOfStock")}</span>}
      </Link>

      <div className="card-body">
        {product.brand && <span className="card-brand">{product.brand}</span>}
        <h3 className="card-title">
          <Link href={`/p/${product.slug}`}>{product.title}</Link>
        </h3>
        {specs && <div className="card-specs">{specs}</div>}

        <div className="price-row-card">
          <span className="price">{formatMoney(product.price_cents, locale, product.currency)}</span>
          {discount !== null && product.regular_price_cents !== null && (
            <span className="price-was">
              {formatMoney(product.regular_price_cents, locale, product.currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
