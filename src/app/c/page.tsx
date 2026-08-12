import { CatalogView, type SearchParams } from "@/components/CatalogView";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getLocale();
  const params = await searchParams;

  return (
    <div className="container">
      <h1 className="page-title">{t(locale, "nav.allProducts")}</h1>
      <CatalogView locale={locale} basePath="/c" searchParams={params} />
    </div>
  );
}
