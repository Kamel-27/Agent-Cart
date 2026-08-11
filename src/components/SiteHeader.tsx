import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import { t, type Locale } from "@/lib/i18n";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const cartCount = await getCartCount();
  const isAr = locale === "ar";

  return (
    <>
      {/* Top Utility Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div>
            <span className="top-dot"></span>
            {t(locale, "top.auth")}
          </div>
          <div style={{ color: "#7d838a" }}>
            {t(locale, "top.ship")}
          </div>
          <div style={{ marginInlineStart: "auto", color: "#7d838a" }}>
            {t(locale, "top.help")}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header">
        <div className="container">
          <div className="header-row">
            {/* Brand Logo */}
            <Link href="/" className="brand-logo">
              <span className="brand-name">{t(locale, "site.name")}</span>
              <span className="brand-tag">EG</span>
            </Link>

            {/* Search Input Form */}
            <form className="search-form" action="/search" method="get" role="search">
              <span style={{ color: "#98a1ae", fontSize: "15px" }}>⌕</span>
              <input
                type="search"
                name="q"
                placeholder={t(locale, "nav.search")}
                aria-label={t(locale, "nav.search")}
              />
            </form>

            {/* Navigation Actions */}
            <div className="nav-actions">
              {/* Language Switcher */}
              <form action="/api/locale" method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locale" value={isAr ? "en" : "ar"} />
                <button
                  type="submit"
                  style={{
                    border: "1px solid #e3e6ea",
                    background: "#ffffff",
                    color: "var(--text-main)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🌐 {isAr ? "English" : "العربية"}
                </button>
              </form>

              {/* Account / Orders */}
              <Link href="/cart" className="account-btn">
                <div className="sub">{isAr ? "أهلاً بك" : "Hello"}</div>
                <div className="main">{t(locale, "nav.account")}</div>
              </Link>

              {/* Cart Button */}
              <Link href="/cart" className="cart-btn">
                <span>{t(locale, "nav.cart")}</span>
                <span className="cart-badge">{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Navbar */}
        <nav className="category-nav">
          <div className="container" style={{ display: "flex", gap: "22px" }}>
            <Link href="/c/smartphones" className="category-link active">
              {t(locale, "nav.allProducts")}
            </Link>

            <Link href="/c/smartphones?brand=Samsung" className="category-link">
              Samsung
            </Link>
            <Link href="/c/smartphones?brand=Apple" className="category-link">
              Apple
            </Link>
            <Link href="/c/smartphones?brand=Xiaomi" className="category-link">
              Xiaomi
            </Link>
            <Link href="/c/smartphones?brand=Realme" className="category-link">
              realme
            </Link>
            <Link href="/c/smartphones?brand=Oppo" className="category-link">
              OPPO
            </Link>
            <Link href="/c/smartphones?brand=Honor" className="category-link">
              HONOR
            </Link>

            <Link href="/compare" className="category-link" style={{ marginInlineStart: "auto", color: "var(--primary)" }}>
              ⚖️ {isAr ? "مقارنة الهواتف" : "Compare"}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
