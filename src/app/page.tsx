import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const [featured, newest] = await Promise.all([
    listProducts({ categorySlug: "smartphones", sort: "relevance", perPage: 8, inStockOnly: true }),
    listProducts({ categorySlug: "smartphones", sort: "newest", perPage: 8, inStockOnly: true }),
  ]);

  return (
    <div className="main-wrapper">
      <div className="container">
        {/* Mobilia Hero Showcase */}
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
              <Link href="/c/smartphones" className="btn-outline-white">
                {t(locale, "hero.ctaSecondary")}
              </Link>
            </div>
          </div>

          <div className="hero-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/products/samsung-press-hero.svg"
              alt="Flagship Smartphone"
            />
          </div>
        </section>

        {/* Trust Items Strip */}
        <section className="trust-strip">
          <div className="trust-item">
            <div className="title">{isAr ? "ضمان محلي 100%" : "100% Local Warranty"}</div>
            <div className="body">{isAr ? "أجهزة أصلية معتمدة مع ضمان سنتين من الوكيل" : "Genuine devices with official 2-year warranty"}</div>
          </div>
          <div className="trust-item">
            <div className="title">{isAr ? "توصيل سريع" : "Express Delivery"}</div>
            <div className="body">{isAr ? "توصيل في نفس اليوم للقاهرة والجيزة" : "Same-day delivery in Cairo & Giza"}</div>
          </div>
          <div className="trust-item">
            <div className="title">{isAr ? "تقسيط حتى 36 شهر" : "Instalments up to 36m"}</div>
            <div className="body">{isAr ? "عبر valU وContact والبنوك بدون موظف" : "Via valU, Contact, and major banks"}</div>
          </div>
          <div className="trust-item">
            <div className="title">{isAr ? "استبدال مباشر" : "Direct Trade-in"}</div>
            <div className="body">{isAr ? "قيم جهازك القديم واخصمه من الفاتورة فوراً" : "Get instant value off your new phone invoice"}</div>
          </div>
        </section>

        {/* Shop By Brand Section */}
        <section className="brands-section">
          <div className="section-header-row">
            <h2 className="section-title-main">{t(locale, "brands.title")}</h2>
            <Link href="/c/smartphones" style={{ color: "var(--primary)", fontWeight: 600, fontSize: "13px" }}>
              {t(locale, "brands.viewAll")} →
            </Link>
          </div>

          <div className="brands-grid">
            <Link href="/c/smartphones?brand=Samsung" className="brand-card">
              Samsung
            </Link>
            <Link href="/c/smartphones?brand=Apple" className="brand-card">
              Apple
            </Link>
            <Link href="/c/smartphones?brand=Xiaomi" className="brand-card">
              Xiaomi
            </Link>
            <Link href="/c/smartphones?brand=Realme" className="brand-card">
              realme
            </Link>
            <Link href="/c/smartphones?brand=Infinix" className="brand-card">
              Infinix
            </Link>
            <Link href="/c/smartphones?brand=Vivo" className="brand-card">
              Vivo
            </Link>
            <Link href="/c/smartphones?brand=Oppo" className="brand-card">
              OPPO
            </Link>
            <Link href="/c/smartphones?brand=Honor" className="brand-card">
              HONOR
            </Link>
          </div>
        </section>

        {/* Weekly Deals Section */}
        <section style={{ paddingBlock: "20px 8px" }}>
          <div className="section-header-row">
            <h2 className="section-title-main">{t(locale, "deals.title")}</h2>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--sale)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em" }}>
              {t(locale, "deals.timer")}
            </span>
          </div>

          <div className="phone-grid">
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>

        {/* New Releases Section */}
        <section style={{ paddingBlock: "28px 8px" }}>
          <div className="section-header-row">
            <h2 className="section-title-main">{isAr ? "أحدث الإصدارات" : "New Releases"}</h2>
            <Link href="/c/smartphones?sort=newest" style={{ color: "var(--primary)", fontWeight: 600, fontSize: "13px" }}>
              {t(locale, "brands.viewAll")} →
            </Link>
          </div>

          <div className="phone-grid">
            {newest.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>

        {/* Trade-in Estimator Card */}
        <section className="trade-card">
          <div>
            <div className="trade-kicker">{t(locale, "trade.kicker")}</div>
            <h3 className="trade-title">{t(locale, "trade.title")}</h3>
            <p className="trade-body">{t(locale, "trade.body")}</p>
            <button className="btn-dark">{t(locale, "trade.cta")}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", background: "#ffffff" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>iPhone 13 Pro (256GB)</div>
              <div style={{ fontSize: "15px", fontStyle: "normal", fontWeight: 700, color: "var(--text-main)", marginTop: "3px" }}>
                {isAr ? "32,500 ج.م" : "EGP 32,500"}
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", background: "#ffffff" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Galaxy S22 Ultra (256GB)</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "3px" }}>
                {isAr ? "28,000 ج.م" : "EGP 28,000"}
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", background: "#ffffff" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>realme 11 Pro+ (256GB)</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "3px" }}>
                {isAr ? "14,200 ج.م" : "EGP 14,200"}
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", background: "#ffffff" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Redmi Note 12 Pro (256GB)</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "3px" }}>
                {isAr ? "10,500 ج.م" : "EGP 10,500"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
