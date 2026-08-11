import Link from "next/link";
import { listCategories } from "@/lib/catalog";
import { getCartCount } from "@/lib/cart";
import { t, type Locale } from "@/lib/i18n";

/**
 * Server component. The search box and the language switch are plain forms, so
 * navigation and locale switching work with JavaScript disabled and there is no
 * client bundle for the header at all.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const [categories, cartCount] = await Promise.all([listCategories(), getCartCount()]);

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-row">
          <Link href="/" className="brand">
            {t(locale, "site.name")}
            <small>{t(locale, "site.tagline")}</small>
          </Link>

          <form className="search-form" action="/search" method="get" role="search">
            <input
              type="search"
              name="q"
              placeholder={t(locale, "nav.search")}
              aria-label={t(locale, "nav.search")}
            />
            <button className="btn" type="submit">
              {locale === "ar" ? "بحث" : "Search"}
            </button>
          </form>

          <nav className="nav-links">
            <form action="/api/locale" method="post">
              <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
              <button className="btn-link" type="submit">
                {locale === "ar" ? "English" : "العربية"}
              </button>
            </form>

            <Link href="/compare" className="btn-link">
              {locale === "ar" ? "المقارنة" : "Compare"}
            </Link>

            <Link href="/cart" className="cart-pill">
              {t(locale, "nav.cart")}
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </Link>
          </nav>
        </div>

        <nav className="category-bar">
          <Link href="/c">{t(locale, "nav.allProducts")}</Link>
          {categories.map((category) => (
            <Link key={category.slug} href={`/c/${category.slug}`}>
              {locale === "ar" ? category.name_ar : category.name_en}
              {" "}
              <span style={{ opacity: 0.55 }}>({category.product_count})</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
