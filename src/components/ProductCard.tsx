import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatMoney, discountPercent } from "@/lib/money";
import { t, type Locale } from "@/lib/i18n";

export function ProductCard({ product, locale }: { product: ProductRow; locale: Locale }) {
  const isAr = locale === "ar";
  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const image = product.images[0] ?? "/images/products/smartphone-hero.svg";
  const rating = product.rating_avg !== null ? Number(product.rating_avg) : null;

  const storage = product.attrs.storage_gb ? `${product.attrs.storage_gb}GB` : null;
  const ram = product.attrs.ram_gb ? `${product.attrs.ram_gb}GB RAM` : null;
  const refresh = product.attrs.refresh_hz ? `${product.attrs.refresh_hz}Hz` : null;
  const has5g = product.attrs.has_5g === true ? "5G" : null;

  return (
    <article className="phone-card">
      <Link href={`/p/${product.slug}`} className="phone-media">
        {discount !== null && <span className="discount-badge">−{discount}%</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={product.title} loading="lazy" />
      </Link>

      <div className="phone-body">
        {product.brand && <span className="phone-brand">{product.brand}</span>}
        <h3 className="phone-title">
          <Link href={`/p/${product.slug}`}>{product.title}</Link>
        </h3>

        {rating !== null && product.rating_count > 0 && (
          <div className="rating-row">
            <span className="rating-stars">★</span>
            <span className="rating-score">{rating.toFixed(1)}</span>
            <span>({product.rating_count})</span>
          </div>
        )}

        <div className="spec-badges-row">
          {storage && <span className="spec-tag">{storage}</span>}
          {ram && <span className="spec-tag">{ram}</span>}
          {refresh && <span className="spec-tag">{refresh}</span>}
          {has5g && <span className="spec-tag">5G</span>}
        </div>

        <div className="phone-price-row">
          <span className="phone-price">{formatMoney(product.price_cents, locale, product.currency)}</span>
          {discount !== null && product.regular_price_cents !== null && (
            <span className="phone-price-was">
              {formatMoney(product.regular_price_cents, locale, product.currency)}
            </span>
          )}
        </div>

        <div className="card-actions">
          <form action="/api/cart" method="post" style={{ display: "contents" }}>
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="quantity" value={1} />
            <button className="btn-add-cart" type="submit" disabled={!product.in_stock}>
              {product.in_stock ? `+ ${t(locale, "product.addToCart")}` : t(locale, "product.outOfStock")}
            </button>
          </form>

          <Link href={`/compare?ids=${product.id}`} className="btn-icon" title={t(locale, "product.compare")}>
            ⚖️
          </Link>
        </div>

        <span className={`stock-badge${product.in_stock ? "" : " is-out"}`}>
          {product.in_stock ? t(locale, "product.inStock") : t(locale, "product.outOfStock")}
        </span>
      </div>
    </article>
  );
}
