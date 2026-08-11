import Link from "next/link";
import { listCategories, listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getLocale();
  const [categories, deals] = await Promise.all([
    listCategories(),
    listProducts({ sort: "relevance", perPage: 8, inStockOnly: true }),
  ]);

  return (
    <div className="container">
      <h1 className="page-title">{t(locale, "site.name")}</h1>
      <p className="page-sub">{t(locale, "site.tagline")}</p>

      <div className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {categories.map((category) => (
          <Link key={category.slug} href={`/c/${category.slug}`} className="card" style={{ padding: 18 }}>
            <strong>{locale === "ar" ? category.name_ar : category.name_en}</strong>
            <span className="result-count">
              {category.product_count} {t(locale, "misc.results")}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">{locale === "ar" ? "منتجات مختارة" : "Featured"}</h2>
      <div className="product-grid">
        {deals.products.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </div>
  );
}
