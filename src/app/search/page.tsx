import { CatalogView, type SearchParams } from "@/components/CatalogView";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const raw = params.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  return (
    <div className="container">
      <h1 className="page-title">
        {t(locale, "search.resultsFor")} “{q}”
      </h1>
      <p className="page-sub" />
      <CatalogView locale={locale} basePath="/search" searchParams={params} />
    </div>
  );
}
