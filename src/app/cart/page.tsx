import Link from "next/link";
import { getCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [locale, cart] = await Promise.all([getLocale(), getCart()]);

  if (cart.lines.length === 0) {
    return (
      <div className="container">
        <h1 className="page-title">{t(locale, "cart.title")}</h1>
        <p className="empty-state">
          {t(locale, "cart.empty")}
          <br />
          <br />
          <Link className="btn" href="/c">
            {t(locale, "cart.continue")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">{t(locale, "cart.title")}</h1>
      <p className="page-sub">
        {cart.itemCount} {t(locale, "cart.itemCount")}
      </p>

      {cart.lines.map((line) => (
        <div className="cart-line" key={line.product_id}>
          <div className="cart-thumb">{line.images[0] ? "" : t(locale, "product.noImage")}</div>

          <div>
            <Link href={`/p/${line.slug}`} style={{ fontWeight: 600 }}>
              {line.title}
            </Link>
            <div className="result-count">
              {formatMoney(line.unit_price_cents, locale, line.currency)}
              {!line.in_stock && (
                <span className="badge badge-out" style={{ marginInlineStart: 8 }}>
                  {t(locale, "product.outOfStock")}
                </span>
              )}
            </div>

            <div className="cart-actions">
              <form className="qty-form" action="/api/cart" method="post">
                <input type="hidden" name="action" value="set" />
                <input type="hidden" name="product_id" value={line.product_id} />
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  max={99}
                  defaultValue={line.quantity}
                  aria-label={t(locale, "cart.quantity")}
                />
                <button className="btn btn-secondary btn-sm" type="submit">
                  {t(locale, "cart.update")}
                </button>
              </form>

              <form action="/api/cart" method="post">
                <input type="hidden" name="action" value="remove" />
                <input type="hidden" name="product_id" value={line.product_id} />
                <button className="btn-link" type="submit">
                  {t(locale, "cart.remove")}
                </button>
              </form>
            </div>
          </div>

          <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
            {formatMoney(line.line_total_cents, locale, line.currency)}
          </div>
        </div>
      ))}

      <div className="cart-summary">
        <div>
          <div className="result-count">{t(locale, "cart.subtotal")}</div>
          {/* Computed server-side from database prices on every render. */}
          <div className="cart-total">{formatMoney(cart.subtotalCents, locale, cart.currency)}</div>
        </div>
        <form action="/api/checkout" method="post">
          <button className="btn" type="submit">
            {t(locale, "cart.checkout")}
          </button>
        </form>
      </div>
    </div>
  );
}
