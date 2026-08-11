import Link from "next/link";
import { listCategories } from "@/lib/catalog";
import { getCartCount } from "@/lib/cart";
import { t, type Locale } from "@/lib/i18n";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const [categories, cartCount] = await Promise.all([listCategories(), getCartCount()]);
  const isAr = locale === "ar";

  return (
    <>
      {/* Top Announcement Ticker */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div>
            {isAr
              ? "⚡ توصيل سريع لجميع المحافظات | ضمان رسمي 100%"
              : "⚡ Fast Express Shipping Across Egypt | 100% Official Warranty"}
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>{isAr ? "خدمة العملاء: 19000" : "Support: 19000"}</span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="site-header">
        <div className="container">
          <div className="header-row">
            {/* Brand Logo */}
            <Link href="/" className="brand-logo">
              <span>{isAr ? "دبي فون" : "Dubai Phone"}</span>
              <span className="badge-tag">{isAr ? "ذكائي" : "AI STORE"}</span>
            </Link>

            {/* Search Form */}
            <form className="search-form" action="/search" method="get" role="search">
              <input
                type="search"
                name="q"
                placeholder={isAr ? "ابحث عن هاتف، ماركة (سامسونج، آيفون، شاومي)..." : "Search phones, brands (Samsung, iPhone, Xiaomi)..."}
                aria-label={t(locale, "nav.search")}
              />
              <button type="submit">
                {isAr ? "بحث" : "Search"}
              </button>
            </form>

            {/* Navigation Actions */}
            <div className="nav-actions">
              {/* Language Toggle */}
              <form action="/api/locale" method="post">
                <input type="hidden" name="locale" value={isAr ? "en" : "ar"} />
                <button className="nav-btn" type="submit">
                  🌐 {isAr ? "English" : "العربية"}
                </button>
              </form>

              {/* Compare Page */}
              <Link href="/compare" className="nav-btn">
                ⚖️ {isAr ? "المقارنة" : "Compare"}
              </Link>

              {/* Cart Button */}
              <Link href="/cart" className="cart-btn">
                🛒 {t(locale, "nav.cart")}
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

          {/* Smartphone Category & Brand Navigation */}
          <nav className="category-nav">
            <Link href="/c/smartphones" className="category-pill active">
              📱 {isAr ? "جميع الهواتف" : "All Smartphones"}
            </Link>
            <Link href="/c/smartphones?brand=Samsung" className="category-pill">
              Samsung
            </Link>
            <Link href="/c/smartphones?brand=Apple" className="category-pill">
              Apple
            </Link>
            <Link href="/c/smartphones?brand=Xiaomi" className="category-pill">
              Xiaomi
            </Link>
            <Link href="/c/smartphones?brand=Realme" className="category-pill">
              Realme
            </Link>
            <Link href="/c/smartphones?brand=Infinix" className="category-pill">
              Infinix
            </Link>
            <Link href="/c/smartphones?brand=Vivo" className="category-pill">
              Vivo
            </Link>
            <Link href="/c/smartphones?brand=Oppo" className="category-pill">
              OPPO
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
