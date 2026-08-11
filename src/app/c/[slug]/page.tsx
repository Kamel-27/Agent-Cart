import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/catalog";
import { CatalogView, type SearchParams } from "@/components/CatalogView";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const [locale, category, query] = await Promise.all([
    getLocale(),
    getCategoryBySlug(slug),
    searchParams,
  ]);

  if (!category) notFound();

  return (
    <div className="container">
      <h1 className="page-title">{locale === "ar" ? category.name_ar : category.name_en}</h1>
      <p className="page-sub">
        {category.product_count} {t(locale, "misc.results")}
      </p>
      <CatalogView
        locale={locale}
        basePath={`/c/${category.slug}`}
        searchParams={query}
        categorySlug={category.slug}
      />
    </div>
  );
}
