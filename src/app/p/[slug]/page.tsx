import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getCategoryBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { formatMoney, discountPercent } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
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

/** Real, downloaded press photos are .jpg/.png/.webp; every placeholder asset
 *  in this repo is a generated .svg. That split is what gates the rich
 *  photo+prose spec sections below — no fabricated imagery. */
function isRealPhoto(url: string): boolean {
  return /\.(jpe?g|png|webp)(\?|$)/i.test(url);
}

type SpecCategory = "display" | "camera" | "battery" | "performance";

function hasSpecHighlight(category: SpecCategory, attrs: Record<string, unknown>, images: string[]): boolean {
  if (!images.some(isRealPhoto)) return false;
  switch (category) {
    case "display":
      return Boolean(attrs.screen_in && attrs.display_type && attrs.refresh_hz);
    case "camera":
      return Boolean(attrs.rear_camera_mp);
    case "battery":
      return Boolean(attrs.battery_mah && attrs.charging_w);
    case "performance":
      return Boolean(attrs.chipset && attrs.ram_gb);
  }
}

function specHighlightCopy(category: SpecCategory, attrs: Record<string, unknown>, locale: Locale, title: string): { heading: string; body: string } {
  const isAr = locale === "ar";
  switch (category) {
    case "display":
      return {
        heading: isAr ? "الشاشة" : "Display",
        body: isAr
          ? `شاشة ${attrs.screen_in}" من نوع ${attrs.display_type} بمعدل تحديث ${attrs.refresh_hz}Hz.`
          : `${title} has a ${attrs.screen_in}" ${attrs.display_type} display with a ${attrs.refresh_hz}Hz refresh rate.`,
      };
    case "camera":
      return {
        heading: isAr ? "الكاميرا" : "Camera",
        body: isAr
          ? `كاميرا خلفية ${attrs.rear_camera_mp} ميجابكسل${attrs.front_camera_mp ? ` وكاميرا أمامية ${attrs.front_camera_mp} ميجابكسل` : ""}.`
          : `A ${attrs.rear_camera_mp}MP main camera${attrs.front_camera_mp ? ` and a ${attrs.front_camera_mp}MP front camera` : ""}.`,
      };
    case "battery":
      return {
        heading: isAr ? "البطارية" : "Battery",
        body: isAr
          ? `بطارية ${attrs.battery_mah} مللي أمبير مع شحن سلكي ${attrs.charging_w} وات.`
          : `A ${attrs.battery_mah} mAh battery with ${attrs.charging_w}W wired charging.`,
      };
    case "performance":
      return {
        heading: isAr ? "الأداء" : "Performance",
        body: isAr
          ? `معالج ${attrs.chipset} مع ${attrs.ram_gb} جيجا رام${attrs.storage_gb ? ` و${attrs.storage_gb} جيجا تخزين` : ""}.`
          : `Powered by ${attrs.chipset} with ${attrs.ram_gb}GB of RAM${attrs.storage_gb ? ` and ${attrs.storage_gb}GB of storage` : ""}.`,
      };
  }
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
  const rating = product.rating_avg !== null ? Number(product.rating_avg) : null;

  const specRows = schema.map((entry) => ({
    key: entry.key,
    label: specLabel(entry.key, entry),
    value: specValue(product.attrs[entry.key], locale),
  }));

  const images = product.images.length > 0 ? product.images : ["/images/products/smartphone-hero.svg"];
  const mainImage = images[0]!;

  const highlightCategories: SpecCategory[] = ["display", "camera", "battery", "performance"];
  const highlights = highlightCategories
    .filter((cat) => hasSpecHighlight(cat, product.attrs, images))
    .map((cat, i) => ({
      category: cat,
      image: images[Math.min(i, images.length - 1)]!,
      ...specHighlightCopy(cat, product.attrs, locale, product.title),
    }));

  const assurance = [
    ["assurance.auth.title", "assurance.auth.body"],
    ["assurance.warranty.title", "assurance.warranty.body"],
    ["assurance.pay.title", "assurance.pay.body"],
  ] as const;

  return (
    <div className="main-wrapper" style={{ paddingBlockStart: 20 }}>
      <div className="container">
        <div className="crumb">
          <Link href="/">{t(locale, "nav.home")}</Link>
          {" / "}
          <Link href={`/c/${product.category_slug}`}>{isAr ? product.category_name_ar : product.category_name_en}</Link>
          {" / "}
          <span>{product.brand}</span>
        </div>

        <div className="product-layout">
          <div>
            <div className="product-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImage} alt={product.title} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.slice(0, 4).map((img, i) => (
                  <div className={`gallery-thumb${i === 0 ? " is-active" : ""}`} key={img}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.title} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.brand && <span className="phone-brand">{product.brand}</span>}
            <h1 className="product-title">{product.title}</h1>

            {rating !== null && product.rating_count > 0 && (
              <div className="rating-row" style={{ marginBlockEnd: 10 }}>
                <span className="rating-stars">★★★★★</span>
                <span className="rating-score">{rating.toFixed(1)}</span>
                <span>
                  ({product.rating_count} {t(locale, "product.reviews")})
                </span>
                <span style={{ color: "var(--border)" }}>|</span>
                <span className={`stock-badge${product.in_stock ? "" : " is-out"}`}>
                  {product.in_stock ? t(locale, "product.inStock") : t(locale, "product.outOfStock")}
                </span>
              </div>
            )}
            {(rating === null || product.rating_count === 0) && (
              <div style={{ marginBlockEnd: 10 }}>
                <span className={`stock-badge${product.in_stock ? "" : " is-out"}`}>
                  {product.in_stock ? t(locale, "product.inStock") : t(locale, "product.outOfStock")}
                </span>
              </div>
            )}

            <div className="phone-price-row" style={{ marginBlockEnd: 4 }}>
              <span className="product-price">{formatMoney(product.price_cents, locale, product.currency)}</span>
              {discount !== null && product.regular_price_cents !== null && (
                <>
                  <span className="phone-price-was" style={{ fontSize: 15 }}>
                    {formatMoney(product.regular_price_cents, locale, product.currency)}
                  </span>
                  <span className="discount-badge" style={{ position: "static" }}>
                    −{discount}%
                  </span>
                </>
              )}
            </div>

            {description && <p className="product-desc">{description}</p>}

            <div style={{ display: "flex", gap: 12, marginBlock: 8, flexWrap: "wrap" }}>
              <form action="/api/cart" method="post" style={{ display: "flex", gap: 10, alignItems: "center", flex: "1 1 auto", minWidth: 220 }}>
                <input type="hidden" name="action" value="add" />
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="redirect_to" value={`/p/${product.slug}`} />
                <input type="number" name="quantity" defaultValue={1} min={1} max={99} style={{ inlineSize: 70, padding: "12px 10px", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13 }} />
                <button className="btn-primary" style={{ flex: 1 }} type="submit" disabled={!product.in_stock}>
                  {product.in_stock ? t(locale, "product.addToCart") : t(locale, "product.outOfStock")}
                </button>
              </form>

              <Link href={`/compare?ids=${product.id}`} className="btn-outline-white" style={{ color: "var(--ink)", borderColor: "var(--border)" }}>
                ⚖️ {t(locale, "product.compare")}
              </Link>
            </div>

            <div className="assurance-grid">
              {assurance.map(([titleKey, bodyKey]) => (
                <div className="assurance-card" key={titleKey}>
                  <div className="assurance-card-title">{t(locale, titleKey)}</div>
                  <div className="assurance-card-body">{t(locale, bodyKey)}</div>
                </div>
              ))}
            </div>

            {(prosCons.prosEn.length > 0 || prosCons.consEn.length > 0) && (
              <div className="pros-cons-card">
                <h3>{isAr ? "مميزات وعيوب محسوبة من المواصفات" : "Pros & cons, computed from the spec sheet"}</h3>
                <div>
                  <h4 style={{ color: "var(--green)" }}>{t(locale, "product.pros")}</h4>
                  <ul>
                    {(isAr ? prosCons.prosAr : prosCons.prosEn).map((pro, idx) => (
                      <li key={idx} style={{ color: "var(--green)" }}>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: "var(--sale)" }}>{t(locale, "product.cons")}</h4>
                  <ul>
                    {(isAr ? prosCons.consAr : prosCons.consEn).map((con, idx) => (
                      <li key={idx} style={{ color: "var(--sale)" }}>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {highlights.length > 0 && (
          <section style={{ marginBlockStart: 40 }}>
            {highlights.map((h) => (
              <div className="spec-highlight" key={h.category}>
                <div className="spec-highlight-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt={h.heading} />
                </div>
                <div>
                  <h3 className="spec-highlight-title">{h.heading}</h3>
                  <p className="spec-highlight-body">{h.body}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section style={{ marginBlockStart: 40 }}>
          <h2 className="section-title-main" style={{ marginBlockEnd: 14 }}>
            {t(locale, "product.specs")}
          </h2>
          <table className="spec-table">
            <tbody>
              {specRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className={row.value === null ? "spec-unknown" : undefined}>{row.value ?? t(locale, "product.unknown")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {related.length > 0 && (
          <section style={{ marginBlockStart: 40 }}>
            <h2 className="section-title-main" style={{ marginBlockEnd: 14 }}>
              {t(locale, "product.similar")}
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
