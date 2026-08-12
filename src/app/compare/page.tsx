import Link from "next/link";
import { getProductById } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { PhoneCompareMatrix } from "@/components/PhoneCompareMatrix";
import { t } from "@/lib/i18n";

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const rawIds = (params.ids || "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 4);

  const products = (await Promise.all(rawIds.map((id) => getProductById(id)))).filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );

  return (
    <div className="container" style={{ paddingBlock: 24 }}>
      <h1 className="page-title">{isAr ? "مقارنة الهواتف الذكية" : "Smartphone comparison"}</h1>
      <p className="page-sub">
        {isAr
          ? "قارن مواصفات الهواتف جنباً إلى جنب."
          : "Compare smartphone specifications side by side."}
      </p>

      <PhoneCompareMatrix products={products} locale={locale} />

      <p style={{ marginBlockStart: 24 }}>
        <Link href="/c/smartphones" className="btn btn-secondary">
          ← {t(locale, "nav.allProducts")}
        </Link>
      </p>
    </div>
  );
}
