import type { ProductRow } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { generateProsCons } from "@/lib/pros-cons";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  products: ProductRow[];
  locale: Locale;
}

const SPEC_ROWS = [
  { key: "chipset", labelEn: "Chipset", labelAr: "المعالج" },
  { key: "display_type", labelEn: "Display panel", labelAr: "نوع الشاشة" },
  { key: "screen_in", labelEn: "Screen size", labelAr: "حجم الشاشة", unit: '"' },
  { key: "refresh_hz", labelEn: "Refresh rate", labelAr: "معدل التحديث", unit: "Hz" },
  { key: "battery_mah", labelEn: "Battery", labelAr: "البطارية", unit: "mAh" },
  { key: "charging_w", labelEn: "Fast charging", labelAr: "سرعة الشحن", unit: "W" },
  { key: "rear_camera_mp", labelEn: "Main camera", labelAr: "الكاميرا الخلفية", unit: "MP" },
  { key: "front_camera_mp", labelEn: "Front camera", labelAr: "كاميرا السيلفي", unit: "MP" },
  { key: "has_5g", labelEn: "5G", labelAr: "دعم 5G" },
] as const;

export function PhoneCompareMatrix({ products, locale }: Props) {
  const isAr = locale === "ar";

  if (products.length === 0) {
    return <p className="empty-state">{isAr ? "لم يتم تحديد أي هواتف للمقارنة." : "No smartphones selected for comparison."}</p>;
  }

  return (
    <div className="compare-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th></th>
            {products.map((p) => {
              const image = p.images[0] ?? "/images/products/smartphone-hero.svg";
              return (
                <th key={p.id}>
                  <div className="compare-head-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={p.title} />
                  </div>
                  <div className="compare-head-name">{p.title}</div>
                  <div className="compare-head-price">{formatMoney(p.price_cents, locale, p.currency)}</div>
                  <form action="/api/cart" method="post" style={{ marginBlockStart: 9 }}>
                    <input type="hidden" name="action" value="add" />
                    <input type="hidden" name="product_id" value={p.id} />
                    <input type="hidden" name="quantity" value={1} />
                    <button className="btn btn-sm" type="submit" style={{ width: "100%" }} disabled={!p.in_stock}>
                      {t(locale, "product.addToCart")}
                    </button>
                  </form>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SPEC_ROWS.map((row) => (
            <tr key={row.key}>
              <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{isAr ? row.labelAr : row.labelEn}</td>
              {products.map((p) => {
                const raw = p.attrs[row.key];
                let display: string;
                if (raw === undefined || raw === null) display = "—";
                else if (typeof raw === "boolean") display = raw ? (isAr ? "نعم" : "Yes") : isAr ? "لا" : "No";
                else display = `${raw}${"unit" in row && row.unit ? " " + row.unit : ""}`;
                return (
                  <td key={p.id} style={{ fontWeight: 500 }}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}

          <tr>
            <td style={{ fontWeight: 600, color: "var(--green)" }}>{t(locale, "product.pros")}</td>
            {products.map((p) => {
              const pc = generateProsCons(p.attrs);
              const pros = isAr ? pc.prosAr : pc.prosEn;
              return (
                <td key={p.id} style={{ fontSize: 12 }}>
                  {pros.length > 0 ? (
                    <ul style={{ margin: 0, paddingInlineStart: 16 }}>
                      {pros.map((pro, idx) => (
                        <li key={idx} style={{ color: "var(--green)", marginBlockEnd: 3 }}>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
