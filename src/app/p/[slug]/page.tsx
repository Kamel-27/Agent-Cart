import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getCategoryBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { formatMoney, discountPercent } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

/** Turn an attribute key into a readable row label using the category schema. */
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

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.category_slug),
    getRelatedProducts(product),
  ]);

  const discount = discountPercent(product.price_cents, product.regular_price_cents);
  const description = locale === "ar" ? product.description_ar : product.description_en;
  // Ordered array, so the table reads most-important-first rather than in
  // whatever order JSONB happened to normalize the keys into.
  const schema = category?.attr_schema ?? [];

  // Every field the category defines is shown, including unknown ones. A blank
  // row is information: it says we do not have the figure, which is different
  // from the product not having the feature.
  const specRows = schema.map((entry) => ({
    key: entry.key,
    label: specLabel(entry.key, entry),
    value: specValue(product.attrs[entry.key], locale),
  }));

  return (
    <div className="container">
      <p className="result-count" style={{ marginBlockEnd: 14 }}>
        <Link href={`/c/${product.category_slug}`}>
          {locale === "ar" ? product.category_name_ar : product.category_name_en}
        </Link>
      </p>

      <div className="product-layout">
        <div className="product-media">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" style={{ maxInlineSize: "100%", maxBlockSize: "100%" }} />
          ) : (
            <span>{t(locale, "product.noImage")}</span>
          )}
        </div>

        <div>
          {product.brand && <span className="card-brand">{product.brand}</span>}
          <h1 className="product-title">{product.title}</h1>

          <div className="price-row-card">
            <span className="product-price">
              {formatMoney(product.price_cents, locale, product.currency)}
            </span>
            {discount !== null && product.regular_price_cents !== null && (
              <>
                <span className="price-was">
                  {formatMoney(product.regular_price_cents, locale, product.currency)}
                </span>
                <span className="badge badge-sale">−{discount}%</span>
              </>
            )}
          </div>

          <p style={{ marginBlockStart: 8 }}>
            {product.in_stock ? (
              <span className="badge-in">● {t(locale, "product.inStock")}</span>
            ) : (
              <span className="badge badge-out">{t(locale, "product.outOfStock")}</span>
            )}
          </p>

          {product.highlights_en.length > 0 && locale === "en" && (
            <ul className="highlights">
              {product.highlights_en.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          )}

          {description && <p className="product-desc">{description}</p>}

          {/*
            Plain form POST. The client sends a product id and a quantity;
            the server looks up the price. There is no field here that could
            carry a price, by construction (see src/lib/cart.ts).
          */}
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
              aria-label={t(locale, "cart.quantity")}
              style={{ inlineSize: 76 }}
            />
            <button className="btn" type="submit" disabled={!product.in_stock}>
              {product.in_stock ? t(locale, "product.addToCart") : t(locale, "product.outOfStock")}
            </button>
          </form>

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
          <h2 className="section-title">{locale === "ar" ? "منتجات مشابهة" : "Similar products"}</h2>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
