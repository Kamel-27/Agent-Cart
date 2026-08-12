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

  const summaryRows: Array<{ k: string; v: string; isTotal?: boolean }> = [
    { k: t(locale, "cart.subtotal"), v: formatMoney(cart.subtotalCents, locale, cart.currency) },
    { k: t(locale, "cart.total"), v: formatMoney(cart.subtotalCents, locale, cart.currency), isTotal: true },
  ];

  return (
    <div className="container">
      <h1 className="page-title">{t(locale, "cart.title")}</h1>
      <p className="page-sub">
        {cart.itemCount} {t(locale, "cart.itemCount")}
      </p>

      {cart.lines.map((line) => (
        <div className="cart-line" key={line.product_id}>
          <div className="cart-thumb">
            {line.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.images[0]} alt={line.title} />
            ) : (
              t(locale, "product.noImage")
            )}
          </div>

          <div>
            <Link href={`/p/${line.slug}`} style={{ fontWeight: 600, color: "var(--ink)" }}>
              {line.title}
            </Link>
            <div className="result-count" style={{ marginBlockStart: 3 }}>
              {formatMoney(line.unit_price_cents, locale, line.currency)}
              {!line.in_stock && (
                <span className="badge badge-out" style={{ marginInlineStart: 8 }}>
                  {t(locale, "product.outOfStock")}
                </span>
              )}
            </div>

            <div className="cart-actions">
              <div className="qty-stepper">
                <form action="/api/cart" method="post" style={{ margin: 0 }}>
                  <input type="hidden" name="action" value="set" />
                  <input type="hidden" name="product_id" value={line.product_id} />
                  <input type="hidden" name="quantity" value={Math.max(1, line.quantity - 1)} />
                  <button className="qty-btn" type="submit" aria-label={t(locale, "cart.decrease")}>
                    −
                  </button>
                </form>
                <span className="qty-value">{line.quantity}</span>
                <form action="/api/cart" method="post" style={{ margin: 0 }}>
                  <input type="hidden" name="action" value="set" />
                  <input type="hidden" name="product_id" value={line.product_id} />
                  <input type="hidden" name="quantity" value={Math.min(99, line.quantity + 1)} />
                  <button className="qty-btn" type="submit" aria-label={t(locale, "cart.increase")}>
                    +
                  </button>
                </form>
              </div>

              <form action="/api/cart" method="post" style={{ margin: 0 }}>
                <input type="hidden" name="action" value="remove" />
                <input type="hidden" name="product_id" value={line.product_id} />
                <button className="btn-link" type="submit">
                  {t(locale, "cart.remove")}
                </button>
              </form>
            </div>
          </div>

          <div style={{ fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            {formatMoney(line.line_total_cents, locale, line.currency)}
          </div>
        </div>
      ))}

      <div className="cart-summary">
        <div style={{ flex: 1, minWidth: 200 }}>
          {summaryRows.map((row) => (
            <div className={`summary-row${row.isTotal ? " is-total" : ""}`} key={row.k}>
              <span style={{ color: "var(--text-muted)" }}>{row.k}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.v}</span>
            </div>
          ))}
        </div>
        <div>
          <form action="/api/checkout" method="post">
            <button className="btn" type="submit">
              {t(locale, "cart.checkout")}
            </button>
          </form>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBlockStart: 10, textAlign: "center" }}>
            {t(locale, "cart.securePay")}
          </div>
        </div>
      </div>
    </div>
  );
}
