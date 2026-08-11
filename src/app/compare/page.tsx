import React from "react";
import { getProductById } from "@/services/catalog.service";
import { getLocale } from "@/lib/locale";
import { PhoneCompareMatrix } from "@/components/PhoneCompareMatrix";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const lang = await getLocale();
  const isAr = lang === "ar";

  const rawIds = (params.ids || "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 4);

  const products = (
    await Promise.all(rawIds.map((id) => getProductById(id)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="container" style={{ paddingBlock: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 className="page-title">
          {isAr ? "مقارنة الهواتف الذكية" : "Smartphone Comparison"}
        </h1>
        <p className="page-sub">
          {isAr
            ? "مقارنة مواصفات الهواتف جنبًا إلى جنب مع حسم الفروقات تلقائيًا بناءً على البيانات الدقيقة."
            : "Compare smartphone specifications side-by-side with automatic spec diff resolution."}
        </p>
      </div>

      <PhoneCompareMatrix products={products} lang={lang} />

      <div style={{ marginTop: "24px" }}>
        <Link href="/c/smartphones" className="btn btn-secondary">
          {isAr ? "← العودة إلى قائمة الهواتف" : "← Back to Smartphones"}
        </Link>
      </div>
    </div>
  );
}
