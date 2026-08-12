import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import { t, type Locale } from "@/lib/i18n";

const BRAND_LINKS = ["Samsung", "Apple", "Xiaomi", "Realme", "Vivo", "Oppo", "Honor", "Infinix"];

export async function SiteHeader({ locale }: { locale: Locale }) {
  const cartCount = await getCartCount();
  const isAr = locale === "ar";

  return (
    <>
      {/* Top utility bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <span>
            <span className="top-dot" />
            {t(locale, "top.auth")}
          </span>
          <span>{t(locale, "top.ship")}</span>
          <div className="spacer" />
          <span>{t(locale, "top.help")}</span>
        </div>
      </div>

      {/* Main header */}
      <header className="site-header">
        <div className="container">
          <div className="header-row">
            <Link href="/" className="brand-logo">
              <span>{t(locale, "site.name")}</span>
              <span className="badge-tag">EG</span>
            </Link>

            <form className="search-form" action="/search" method="get" role="search">
              <span style={{ color: "#98a1ae", fontSize: "15px" }}>⌕</span>
              <input
                type="search"
                name="q"
                placeholder={t(locale, "nav.search")}
                aria-label={t(locale, "nav.search")}
              />
            </form>

            <div className="nav-actions">
              <form action="/api/locale" method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locale" value={isAr ? "en" : "ar"} />
                <button className="nav-btn" type="submit">
                  🌐 {isAr ? "English" : "العربية"}
                </button>
              </form>

              <Link href="/compare" className="nav-btn">
                ⚖️ {isAr ? "مقارنة" : "Compare"}
              </Link>

              <Link href="/cart" className="cart-btn">
                <span>{t(locale, "nav.cart")}</span>
                <span className="cart-badge">{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Category / brand navigation */}
        <nav className="category-nav container">
          <Link href="/c/smartphones" className="category-link active">
            {t(locale, "nav.allProducts")}
          </Link>
          {BRAND_LINKS.map((brand) => (
            <Link key={brand} href={`/c/smartphones?brand=${brand}`} className="category-link">
              {brand}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
