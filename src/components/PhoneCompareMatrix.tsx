import React from "react";
import type { ProductRow } from "@/services/catalog.service";
import { generateProsCons } from "@/lib/pros-cons";

interface Props {
  products: ProductRow[];
  lang: "ar" | "en";
}

export function PhoneCompareMatrix({ products, lang }: Props) {
  const isAr = lang === "ar";

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>{isAr ? "لم يتم تحديد أي هواتف للمقارنة." : "No smartphones selected for comparison."}</p>
      </div>
    );
  }

  const keys = [
    { key: "price_cents", labelEn: "Price", labelAr: "السعر", isPrice: true, better: "lower" },
    { key: "chipset", labelEn: "Processor / Chipset", labelAr: "المعالج", better: "none" },
    { key: "display_type", labelEn: "Display Panel", labelAr: "نوع الشاشة", better: "none" },
    { key: "refresh_hz", labelEn: "Refresh Rate", labelAr: "معدل التحديث", unit: "Hz", better: "higher" },
    { key: "battery_mah", labelEn: "Battery Capacity", labelAr: "سعة البطارية", unit: "mAh", better: "higher" },
    { key: "charging_w", labelEn: "Fast Charging", labelAr: "سرعة الشحن", unit: "W", better: "higher" },
    { key: "rear_camera_mp", labelEn: "Main Camera", labelAr: "الكاميرا الخلفية", unit: "MP", better: "higher" },
    { key: "front_camera_mp", labelEn: "Selfie Camera", labelAr: "كاميرا السيلفي", unit: "MP", better: "higher" },
    { key: "has_5g", labelEn: "5G Support", labelAr: "دعم الـ 5G", better: "higher" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="spec-table" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
        <thead>
          <tr>
            <th style={{ padding: "12px", background: "var(--surface-2)" }}>
              {isAr ? "المواصفة" : "Specification"}
            </th>
            {products.map((p) => (
              <th key={p.id} style={{ padding: "12px", textAlign: "center", background: "var(--surface-2)", minWidth: "180px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>{p.title}</div>
                <div style={{ color: "var(--accent)", fontSize: "14px", marginTop: "4px" }}>
                  EGP {(p.price_cents / 100).toLocaleString(isAr ? "ar-EG" : "en-US")}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.key}>
              <td style={{ fontWeight: 600, color: "var(--text-dim)" }}>
                {isAr ? k.labelAr : k.labelEn}
              </td>
              {products.map((p) => {
                let rawVal = k.isPrice ? p.price_cents / 100 : p.attrs[k.key];
                let displayVal = rawVal !== undefined && rawVal !== null ? `${rawVal}${k.unit ? " " + k.unit : ""}` : "—";
                if (typeof rawVal === "boolean") displayVal = rawVal ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");

                return (
                  <td key={p.id} style={{ textAlign: "center", fontWeight: 500 }}>
                    {displayVal}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Statistical Pros / Cons row */}
          <tr>
            <td style={{ fontWeight: 600, color: "var(--ok)" }}>
              {isAr ? "أبرز المميزات (محسوبة)" : "Key Strengths"}
            </td>
            {products.map((p) => {
              const pc = generateProsCons(p.attrs);
              const pros = isAr ? pc.prosAr : pc.prosEn;
              return (
                <td key={p.id} style={{ fontSize: "12px", textAlign: "start" }}>
                  {pros.length > 0 ? (
                    <ul style={{ paddingInlineStart: "16px", margin: 0 }}>
                      {pros.map((pro, idx) => (
                        <li key={idx} style={{ color: "var(--ok)", marginBottom: "3px" }}>{pro}</li>
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
