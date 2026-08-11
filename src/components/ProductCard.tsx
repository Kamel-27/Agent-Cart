import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatMoney, discountPercent } from "@/lib/money";
import { t, type Locale } from "@/lib/i18n";

export function ProductCard({ product, locale }: { product: ProductRow; locale: Locale }) {
  const isAr = locale === "ar";
  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const image = product.images[0] ?? "/images/products/smartphone-hero.svg";

  // Build short spec line (e.g. 6.7" · A17 Pro · 8GB)
  const screen = product.attrs.screen_in ? `${product.attrs.screen_in}"` : null;
  const chip = product.attrs.chipset ? String(product.attrs.chipset) : null;
  const ram = product.attrs.ram_gb ? `${product.attrs.ram_gb}GB` : null;
  const storage = product.attrs.storage_gb ? `${product.attrs.storage_gb}GB` : null;
  const shortSpecParts = [screen, chip || ram, storage].filter(Boolean);
  const shortSpec = shortSpecParts.length > 0 ? shortSpecParts.join(" · ") : (isAr ? "ضمان رسمي محلي" : "Official Local Warranty");

  // Calculate monthly installment (e.g. price / 12)
  const monthlyAmount = Math.round(product.price_cents / 100 / 12);
  const monthlyText = isAr
    ? `من ${monthlyAmount.toLocaleString("en-US")} ج.م شهرياً / 12 شهر`
    : `From EGP ${monthlyAmount.toLocaleString("en-US")}/mo · 12 months`;

  return (
    <article className="mobilia-card">
      <Link href={`/p/${product.slug}`} className="card-media">
        {discount !== null && <span className="badge-discount">−{discount}%</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={product.title} />
      </Link>

      <div className="card-body-content">
        {product.brand && <div className="card-brand-tag">{product.brand}</div>}
        <h3 className="card-title-text">
          <Link href={`/p/${product.slug}`}>{product.title}</Link>
        </h3>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{shortSpec}</div>

        <div className="card-rating-row">
          <span className="star">★</span>
          <span className="score">4.8</span>
          <span>(120)</span>
        </div>

        <div className="card-price-row">
          <span className="current">{formatMoney(product.price_cents, locale, product.currency)}</span>
          {discount !== null && product.regular_price_cents !== null && (
            <span className="was">
              {formatMoney(product.regular_price_cents, locale, product.currency)}
            </span>
          )}
        </div>

        <div className="installment-pill">{monthlyText}</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockStart: "4px" }}>
          <div className="eta-text">{isAr ? "التوصيل غداً في القاهرة" : "Delivered tomorrow in Cairo"}</div>

          <form action="/api/cart" method="post" style={{ margin: 0 }}>
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="quantity" value={1} />
            <button
              type="submit"
              disabled={!product.in_stock}
              style={{
                border: "none",
                background: "var(--primary-soft)",
                color: "var(--primary)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + {t(locale, "product.addToCart")}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
