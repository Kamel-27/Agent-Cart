import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatMoney, discountPercent } from "@/lib/money";
import type { Locale } from "@/lib/i18n";

export function ProductCard({ product, locale }: { product: ProductRow; locale: Locale }) {
  const isAr = locale === "ar";
  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const image = product.images[0] ?? "/images/products/smartphone-hero.svg";

  const storage = product.attrs.storage_gb ? `${product.attrs.storage_gb}GB` : null;
  const ram = product.attrs.ram_gb ? `${product.attrs.ram_gb}GB RAM` : null;
  const refresh = product.attrs.refresh_hz ? `${product.attrs.refresh_hz}Hz` : null;
  const battery = product.attrs.battery_mah ? `${product.attrs.battery_mah}mAh` : null;
  const has5g = product.attrs.has_5g === true ? "5G" : null;

  return (
    <article className="phone-card">
      <Link href={`/p/${product.slug}`} className="phone-media">
        {discount !== null && <span className="discount-badge">-{discount}%</span>}
        {product.in_stock ? (
          <span className="stock-badge">{isAr ? "متوفر" : "In Stock"}</span>
        ) : (
          <span className="stock-badge" style={{ color: "var(--text-dim)" }}>
            {isAr ? "غير متوفر" : "Out of stock"}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={product.title} />
      </Link>

      <div className="phone-body">
        {product.brand && <span className="phone-brand">{product.brand}</span>}
        <h3 className="phone-title">
          <Link href={`/p/${product.slug}`}>{product.title}</Link>
        </h3>

        <div className="spec-badges-row">
          {storage && <span className="spec-tag">💾 {storage}</span>}
          {ram && <span className="spec-tag">⚡ {ram}</span>}
          {refresh && <span className="spec-tag">📱 {refresh}</span>}
          {battery && <span className="spec-tag">🔋 {battery}</span>}
          {has5g && <span className="spec-tag" style={{ color: "var(--primary)" }}>📶 5G</span>}
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
              {isAr ? "+ أضف للسلة" : "+ Add to Cart"}
            </button>
          </form>

          <Link href={`/compare?ids=${product.id}`} className="btn-icon" title={isAr ? "قارن الهواتف" : "Compare"}>
            ⚖️
          </Link>
        </div>
      </div>
    </article>
  );
}
