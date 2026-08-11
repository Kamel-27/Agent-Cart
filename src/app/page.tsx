import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { getLocale } from "@/lib/locale";

export default async function HomePage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const [featured, newest] = await Promise.all([
    listProducts({ categorySlug: "smartphones", sort: "relevance", perPage: 8, inStockOnly: true }),
    listProducts({ categorySlug: "smartphones", sort: "newest", perPage: 8, inStockOnly: true }),
  ]);

  return (
    <div className="container">
      {/* High-Impact Hero Banner */}
      <section className="hero-banner">
        <div>
          <h1 className="hero-title">
            {isAr
              ? "أحدث الهواتف الذكية بأفضل أسعار في مصر"
              : "Latest Smartphones at Unbeatable EGP Prices"}
          </h1>
          <p className="hero-desc">
            {isAr
              ? "تصفح أحدث إصدارات سامسونج، آيفون، شاومي، وريدمي مع مقارنة فورية ومساعد ذكاء اصطناعي يساعدك في اختيار الهاتف المناسب لك."
              : "Browse the latest releases from Samsung, iPhone, Xiaomi, and Realme with instant spec comparisons and an AI shopping assistant."}
          </p>

          <div className="hero-ctas">
            <Link href="/c/smartphones" className="btn-primary">
              📱 {isAr ? "تسوق جميع الهواتف" : "Shop All Smartphones"}
            </Link>
            <Link href="/compare" className="btn-glass">
              ⚖️ {isAr ? "مقارنة الهواتف" : "Compare Phones"}
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/products/samsung-press-hero.svg"
            alt="Flagship Phone"
            style={{ maxWidth: "260px", height: "auto", filter: "drop-shadow(0 10px 20px rgba(6,182,212,0.3))" }}
          />
        </div>
      </section>

      {/* Brand Strip */}
      <section style={{ marginBlock: "24px" }}>
        <div className="brand-strip">
          <Link href="/c/smartphones?brand=Samsung" className="brand-pill">
            <span>📱</span> Samsung
          </Link>
          <Link href="/c/smartphones?brand=Apple" className="brand-pill">
            <span>🍎</span> Apple
          </Link>
          <Link href="/c/smartphones?brand=Xiaomi" className="brand-pill">
            <span>⚡</span> Xiaomi
          </Link>
          <Link href="/c/smartphones?brand=Realme" className="brand-pill">
            <span>🟡</span> Realme
          </Link>
          <Link href="/c/smartphones?brand=Infinix" className="brand-pill">
            <span>🟢</span> Infinix
          </Link>
          <Link href="/c/smartphones?brand=Vivo" className="brand-pill">
            <span>🔵</span> Vivo
          </Link>
          <Link href="/c/smartphones?brand=Oppo" className="brand-pill">
            <span>🟢</span> OPPO
          </Link>
        </div>
      </section>

      {/* Featured Smartphones Grid */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">{isAr ? "الأكثر مبيعاً" : "Best Selling Smartphones"}</h2>
            <p className="section-subtitle">{isAr ? "أجهزة أصلية مع ضمان رسمي وتوصيل سريع" : "100% Genuine phones with official warranty"}</p>
          </div>
          <Link href="/c/smartphones" style={{ color: "var(--primary)", fontWeight: 700 }}>
            {isAr ? "عرض الكل ←" : "View All →"}
          </Link>
        </div>

        <div className="phone-grid">
          {featured.products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </section>

      {/* Newest Releases Grid */}
      <section style={{ marginBlockStart: "40px" }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">{isAr ? "أحدث الإضافات" : "New Releases"}</h2>
            <p className="section-subtitle">{isAr ? "أحدث إصدارات السوق المصري" : "Fresh arrivals in the Egyptian market"}</p>
          </div>
          <Link href="/c/smartphones?sort=newest" style={{ color: "var(--primary)", fontWeight: 700 }}>
            {isAr ? "عرض الكل ←" : "View All →"}
          </Link>
        </div>

        <div className="phone-grid">
          {newest.products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
