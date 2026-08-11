import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; demo?: string }>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const order = params.order ? await getOrder(params.order) : null;
  const isDemo = order?.status === "demo";

  return (
    <div className="container">
      <h1 className="page-title">
        {isDemo ? t(locale, "checkout.demoTitle") : t(locale, "checkout.paidTitle")}
      </h1>

      {isDemo && <div className="notice">{t(locale, "checkout.demoBody")}</div>}

      {order ? (
        <table className="spec-table" style={{ maxInlineSize: 480 }}>
          <tbody>
            <tr>
              <th scope="row">{t(locale, "checkout.orderNumber")}</th>
              <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{order.id}</td>
            </tr>
            <tr>
              <th scope="row">{t(locale, "cart.subtotal")}</th>
              <td>{formatMoney(order.subtotal_cents, locale, order.currency)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="empty-state">{t(locale, "search.noResults")}</p>
      )}

      <p style={{ marginBlockStart: 28 }}>
        <Link className="btn" href="/">
          {t(locale, "checkout.backHome")}
        </Link>
      </p>
    </div>
  );
}
