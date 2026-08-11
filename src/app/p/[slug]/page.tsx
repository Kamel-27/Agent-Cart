import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getCategoryBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { formatMoney, discountPercent } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { generateProsCons } from "@/lib/pros-cons";

function specLabel(key: string, spec: { unit?: string } | undefined): string {
  const base = key
    .replace(/_(gb|mah|mm|mp|hz|in|w|g|h|days|m)$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  return spec?.unit ? `${base} (${spec.unit})` : base;
}

function specValue(value: unknown, locale: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No";
  return String(value);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, product] = await Promise.all([getLocale(), getProductBySlug(slug)]);

  if (!product) notFound();

  const isAr = locale === "ar";
  const [category, related] = await Promise.all([
    getCategoryBySlug(product.category_slug),
    getRelatedProducts(product),
  ]);

  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const description = isAr ? product.description_ar : product.description_en;
  const schema = category?.attr_schema ?? [];
  const prosCons = generateProsCons(product.attrs);

  const specRows = schema.map((entry) => ({
    key: entry.key,
    label: specLabel(entry.key, entry),
    value: specValue(product.attrs[entry.key], locale),
  }));

  const mainImage = product.images[0] ?? "/images/products/smartphone-hero.svg";

  return (
    <div className="container" style={{ paddingBlock: "24px" }}>
      <p className="result-count" style={{ marginBlockEnd: 14 }}>
        <Link href={`/c/${product.category_slug}`}>
          {isAr ? product.category_name_ar : product.category_name_en}
        </Link>
        {" / "}
        <span>{product.brand}</span>
      </p>

      <div className="product-layout">
        <div className="product-media" style={{ background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainImage} alt={product.title} style={{ maxInlineSize: "85%", maxBlockSize: "85%", objectFit: "contain" }} />
        </div>

        <div>
          {product.brand && <span className="phone-brand">{product.brand}</span>}
          <h1 className="product-title">{product.title}</h1>

          <div className="phone-price-row" style={{ marginBlock: "12px" }}>
            <span className="product-price">
              {formatMoney(product.price_cents, locale, product.currency)}
            </span>
            {discount !== null && product.regular_price_cents !== null && (
              <>
                <span className="phone-price-was">
                  {formatMoney(product.regular_price_cents, locale, product.currency)}
                </span>
                <span className="discount-badge" style={{ position: "static" }}>−{discount}%</span>
              </>
            )}
          </div>

          <p style={{ marginBlockStart: 8 }}>
            {product.in_stock ? (
              <span className="stock-badge" style={{ position: "static", background: "var(--price-soft)", color: "var(--price)" }}>
                ● {isAr ? "متوفر في المخزن" : "In Stock"}
              </span>
            ) : (
              <span className="stock-badge" style={{ position: "static" }}>{t(locale, "product.outOfStock")}</span>
            )}
          </p>

          {description && <p className="product-desc">{description}</p>}

          <div style={{ display: "flex", gap: "12px", marginBlock: "20px", flexWrap: "wrap" }}>
            <form action="/api/cart" method="post" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="hidden" name="action" value="add" />
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="redirect_to" value={`/p/${product.slug}`} />
              <input
                type="number"
                name="quantity"
                defaultValue={1}
                min={1}
                max={99}
                style={{ inlineSize: 76 }}
              />
              <button className="btn-primary" type="submit" disabled={!product.in_stock}>
                🛒 {product.in_stock ? (isAr ? "أضف للسلة" : "Add to Cart") : t(locale, "product.outOfStock")}
              </button>
            </form>

            <Link href={`/compare?ids=${product.id}`} className="btn-glass">
              ⚖️ {isAr ? "قارن هذا الهاتف" : "Compare this Phone"}
            </Link>
          </div>

          {/* Pros & Cons Section */}
          {(prosCons.prosEn.length > 0 || prosCons.consEn.length > 0) && (
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBlock: "24px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#fff" }}>
                {isAr ? "مميزات وعيوب الهاتف (محسوبة دقيقاً)" : "Statistically Calculated Pros & Cons"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <h4 style={{ color: "var(--price)", margin: "0 0 6px", fontSize: "13px" }}>{isAr ? "المميزات" : "Pros"}</h4>
                  <ul style={{ margin: 0, paddingInlineStart: "16px", fontSize: "13px" }}>
                    {(isAr ? prosCons.prosAr : prosCons.prosEn).map((pro, idx) => (
                      <li key={idx} style={{ color: "var(--price)", marginBottom: "4px" }}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: "var(--sale)", margin: "0 0 6px", fontSize: "13px" }}>{isAr ? "العيوب" : "Cons"}</h4>
                  <ul style={{ margin: 0, paddingInlineStart: "16px", fontSize: "13px" }}>
                    {(isAr ? prosCons.consAr : prosCons.consEn).map((con, idx) => (
                      <li key={idx} style={{ color: "var(--sale)", marginBottom: "4px" }}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <h2 className="section-title" style={{ marginBlockStart: 32 }}>
            {t(locale, "product.specs")}
          </h2>
          <table className="spec-table">
            <tbody>
              {specRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className={row.value === null ? "spec-unknown" : undefined}>
                    {row.value ?? t(locale, "product.unknown")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBlockStart: "48px" }}>{isAr ? "هواتف مشابهة قد تعجبك" : "Similar Smartphones"}</h2>
          <div className="phone-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
