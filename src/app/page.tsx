import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

const BRANDS = ["Samsung", "Apple", "Xiaomi", "Realme", "Infinix", "Vivo", "Oppo", "Honor"];

export default async function HomePage() {
  const locale = await getLocale();

  const [featured, newest] = await Promise.all([
    listProducts({ categorySlug: "smartphones", sort: "relevance", perPage: 8, inStockOnly: true }),
    listProducts({ categorySlug: "smartphones", sort: "newest", perPage: 8, inStockOnly: true }),
  ]);

  const trustItems = [
    ["trust.genuine.title", "trust.genuine.body"],
    ["trust.payment.title", "trust.payment.body"],
    ["trust.pricing.title", "trust.pricing.body"],
    ["trust.compare.title", "trust.compare.body"],
  ] as const;

  return (
    <div className="main-wrapper">
      <div className="container">
        {/* Hero */}
        <section className="hero-grid">
          <div className="hero-content">
            <div>
              <div className="hero-kicker">{t(locale, "hero.kicker")}</div>
              <h1 className="hero-title">{t(locale, "hero.title")}</h1>
              <p className="hero-body">{t(locale, "hero.body")}</p>
            </div>
            <div className="hero-actions">
              <Link href="/c/smartphones" className="btn-white">
                {t(locale, "hero.ctaPrimary")}
              </Link>
              <Link href="/compare" className="btn-outline-white">
                {t(locale, "hero.ctaSecondary")}
              </Link>
            </div>
          </div>

          <div className="hero-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/products/samsung-press-hero.svg" alt="" />
          </div>
        </section>

        {/* Trust strip */}
        <section className="trust-strip">
          {trustItems.map(([titleKey, bodyKey]) => (
            <div className="trust-item" key={titleKey}>
              <div className="title">{t(locale, titleKey)}</div>
              <div className="body">{t(locale, bodyKey)}</div>
            </div>
          ))}
        </section>

        {/* Shop by brand */}
        <section>
          <div className="section-header-row">
            <h2 className="section-title-main">{t(locale, "brands.title")}</h2>
            <Link href="/c/smartphones" className="section-link">
              {t(locale, "brands.viewAll")} →
            </Link>
          </div>
          <div className="brands-grid">
            {BRANDS.map((brand) => (
              <Link key={brand} href={`/c/smartphones?brand=${brand}`} className="brand-card">
                {brand}
              </Link>
            ))}
          </div>
        </section>

        {/* Best selling */}
        <section>
          <div className="section-header-row">
            <div>
              <h2 className="section-title-main">{t(locale, "deals.title")}</h2>
              <p className="page-sub" style={{ margin: "4px 0 0" }}>
                {t(locale, "deals.subtitle")}
              </p>
            </div>
            <Link href="/c/smartphones" className="section-link">
              {t(locale, "brands.viewAll")} →
            </Link>
          </div>
          <div className="phone-grid">
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>

        {/* New releases */}
        <section>
          <div className="section-header-row">
            <div>
              <h2 className="section-title-main">{t(locale, "new.title")}</h2>
              <p className="page-sub" style={{ margin: "4px 0 0" }}>
                {t(locale, "new.subtitle")}
              </p>
            </div>
            <Link href="/c/smartphones?sort=newest" className="section-link">
              {t(locale, "brands.viewAll")} →
            </Link>
          </div>
          <div className="phone-grid">
            {newest.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
