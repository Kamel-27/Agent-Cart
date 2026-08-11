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

  // Monthly BNPL estimate
  const monthlyAmount = Math.round(product.price_cents / 100 / 12);
  const monthlyText = isAr
    ? `من ${monthlyAmount.toLocaleString("en-US")} ج.م شهرياً عبر valU وContact`
    : `From EGP ${monthlyAmount.toLocaleString("en-US")}/mo via valU & Contact`;

  return (
    <div className="main-wrapper" style={{ paddingBlockStart: "20px" }}>
      <div className="container">
        {/* Breadcrumb line */}
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBlockEnd: "16px" }}>
          <Link href="/" style={{ color: "var(--text-dim)" }}>{t(locale, "nav.home")}</Link>
          {" / "}
          <Link href={`/c/${product.category_slug}`} style={{ color: "var(--text-dim)" }}>
            {isAr ? product.category_name_ar : product.category_name_en}
          </Link>
          {" / "}
          <span>{product.brand}</span>
          {" / "}
          <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{product.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", alignItems: "start" }}>
          {/* Media Container */}
          <div>
            <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", height: "420px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImage} alt={product.title} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
            </div>
          </div>

          {/* Product Info & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {product.brand}
              </div>
              <h1 style={{ margin: "6px 0 8px", fontSize: "26px", fontWeight: 600, color: "var(--text-main)", lineHeight: 1.25 }}>
                {product.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ color: "var(--star)" }}>★★★★★</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>4.9</span>
                <span>(312 {isAr ? "تقييم" : "reviews"})</span>
                <span style={{ color: "#dadee4" }}>|</span>
                <span style={{ color: "var(--ok)", fontWeight: 600 }}>{isAr ? "متوفر بالكرتونة" : "In Stock"}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "30px", fontWeight: 700, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(product.price_cents, locale, product.currency)}
              </span>
              {discount !== null && product.regular_price_cents !== null && (
                <>
                  <span style={{ fontSize: "15px", color: "#98a1ae", textDecoration: "line-through" }}>
                    {formatMoney(product.regular_price_cents, locale, product.currency)}
                  </span>
                  <span style={{ background: "var(--sale-soft)", color: "var(--sale)", fontSize: "12px", fontWeight: 600, borderRadius: "6px", padding: "4px 9px" }}>
                    −{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Installments Box */}
            <div style={{ border: "1px solid var(--primary-border)", background: "var(--primary-soft)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#123f7d" }}>{monthlyText}</div>
              <div style={{ fontSize: "12px", color: "#4c6b96", marginTop: "4px", lineHeight: "1.5" }}>
                {isAr ? "تقسيط عبر valU وContact والبنوك حتى 36 شهر بموافقة فورية بالرقم القومي." : "Valu, Contact, and bank instalments up to 36 months with national ID approval."}
              </div>
            </div>

            {description && <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{description}</p>}

            {/* Shipping & Delivery Info Box */}
            <div style={{ border: "1px solid var(--border)", background: "#ffffff", borderRadius: "var(--radius-lg)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "13px", color: "var(--ok)", fontWeight: 600 }}>
                ⚡ {isAr ? "التوصيل غداً في القاهرة والجيزة" : "Delivered tomorrow in Cairo & Giza"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                {isAr ? "استبدل هاتفك القديم واخصم قيمته مباشرة عند الشراء في الفرع أو أثناء التسليم." : "Trade in your old phone and deduct its value directly upon purchase."}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", marginBlockStart: "8px", flexWrap: "wrap" }}>
              <form action="/api/cart" method="post" style={{ flex: 1, minWidth: "170px", margin: 0 }}>
                <input type="hidden" name="action" value="add" />
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="redirect_to" value={`/p/${product.slug}`} />
                <button
                  type="submit"
                  disabled={!product.in_stock}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "var(--primary)",
                    color: "#ffffff",
                    borderRadius: "11px",
                    padding: "16px 22px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🛒 {isAr ? "أضف إلى السلة" : "Add to Cart"}
                </button>
              </form>

              <Link
                href={`/compare?ids=${product.id}`}
                style={{
                  border: "1px solid var(--text-main)",
                  background: "var(--text-main)",
                  color: "#ffffff",
                  borderRadius: "11px",
                  padding: "16px 22px",
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  display: "inline-block",
                }}
              >
                ⚖️ {isAr ? "مقارنة الهاتف" : "Compare Specs"}
              </Link>
            </div>

            {/* Pros & Cons Engine Section */}
            {(prosCons.prosEn.length > 0 || prosCons.consEn.length > 0) && (
              <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", marginBlockStart: "16px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                  {isAr ? "مميزات وعيوب الهاتف (محسوبة احصائياً)" : "Statistically Calculated Pros & Cons"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <h4 style={{ color: "var(--ok)", margin: "0 0 6px", fontSize: "13px" }}>{isAr ? "المميزات" : "Pros"}</h4>
                    <ul style={{ margin: 0, paddingInlineStart: "16px", fontSize: "13px" }}>
                      {(isAr ? prosCons.prosAr : prosCons.prosEn).map((pro, idx) => (
                        <li key={idx} style={{ color: "var(--ok)", marginBottom: "4px" }}>{pro}</li>
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

            {/* Specs Table */}
            <h2 className="section-title-main" style={{ marginBlockStart: "32px" }}>
              {t(locale, "product.specs")}
            </h2>
            <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              {specRows.map((row) => (
                <div key={row.key} style={{ display: "flex", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: "180px", minWidth: "120px", fontSize: "13px", color: "var(--text-muted)" }}>{row.label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{row.value ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Similar Phones */}
        {related.length > 0 && (
          <section style={{ marginBlockStart: "48px" }}>
            <h2 className="section-title-main" style={{ marginBlockEnd: "16px" }}>
              {isAr ? "هواتف مشابهة قد تعجبك" : "Similar Smartphones"}
            </h2>
            <div className="phone-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
