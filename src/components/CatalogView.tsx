import Link from "next/link";
import { listProducts, type CatalogFilters, type SortKey } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { formatMoney } from "@/lib/money";
import { t, type Locale } from "@/lib/i18n";

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

const SORT_KEYS: SortKey[] = ["relevance", "price_asc", "price_desc", "newest"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function toInt(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Parse the URL into filters. Anything unrecognized is dropped, not trusted. */
export function parseFilters(params: SearchParams, categorySlug?: string): CatalogFilters {
  const sortRaw = first(params.sort);
  const sort = SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : "relevance";

  // Prices are entered in pounds and stored in piastres.
  const minPounds = toInt(first(params.min));
  const maxPounds = toInt(first(params.max));

  return {
    categorySlug,
    q: first(params.q)?.trim() || undefined,
    brands: all(params.brand).filter((b) => b.length > 0),
    minPriceCents: minPounds !== undefined ? minPounds * 100 : undefined,
    maxPriceCents: maxPounds !== undefined ? maxPounds * 100 : undefined,
    inStockOnly: first(params.stock) === "1",
    sort,
    page: toInt(first(params.page)) ?? 1,
  };
}

function buildQuery(params: SearchParams, overrides: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" && "page" in overrides) continue;
    for (const item of all(value)) search.append(key, item);
  }
  for (const [key, value] of Object.entries(overrides)) {
    search.delete(key);
    if (value !== undefined) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

interface Props {
  locale: Locale;
  basePath: string;
  searchParams: SearchParams;
  categorySlug?: string | undefined;
}

export async function CatalogView({ locale, basePath, searchParams, categorySlug }: Props) {
  const filters = parseFilters(searchParams, categorySlug);
  const result = await listProducts(filters);
  const selectedBrands = new Set(filters.brands ?? []);

  const sortOptions: Array<{ key: SortKey; labelKey: string }> = [
    { key: "relevance", labelKey: "sort.relevance" },
    { key: "price_asc", labelKey: "sort.priceAsc" },
    { key: "price_desc", labelKey: "sort.priceDesc" },
    { key: "newest", labelKey: "sort.newest" },
  ];

  return (
    <div className="layout-split">
      <aside>
        {/*
          A plain GET form: the URL is the state. That makes every filtered view
          shareable and bookmarkable, keeps the back button correct, and means
          this page ships zero client JavaScript.
        */}
        <form className="filters" method="get" action={basePath}>
          <h2>{t(locale, "filters.title")}</h2>

          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {filters.sort && filters.sort !== "relevance" && (
            <input type="hidden" name="sort" value={filters.sort} />
          )}

          {result.brandFacets.length > 1 && (
            <div className="filter-group">
              <span className="filter-legend">{t(locale, "filters.brand")}</span>
              {result.brandFacets.slice(0, 12).map((facet) => (
                <label key={facet.brand} className="checkbox-row">
                  <input
                    type="checkbox"
                    name="brand"
                    value={facet.brand}
                    defaultChecked={selectedBrands.has(facet.brand)}
                  />
                  <span style={{ flex: 1 }}>{facet.brand}</span>
                  <span className="facet-count">{facet.count}</span>
                </label>
              ))}
            </div>
          )}

          <div className="filter-group">
            <span className="filter-legend">{t(locale, "filters.priceRange")}</span>
            <div className="price-row">
              <input
                type="number"
                name="min"
                min="0"
                placeholder={t(locale, "filters.min")}
                aria-label={t(locale, "filters.min")}
                defaultValue={first(searchParams.min) ?? ""}
              />
              <span aria-hidden="true">–</span>
              <input
                type="number"
                name="max"
                min="0"
                placeholder={t(locale, "filters.max")}
                aria-label={t(locale, "filters.max")}
                defaultValue={first(searchParams.max) ?? ""}
              />
            </div>
            {result.priceBounds && (
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBlockStart: 8 }}>
                {formatMoney(result.priceBounds.min, locale)} – {formatMoney(result.priceBounds.max, locale)}
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="checkbox-row">
              <input type="checkbox" name="stock" value="1" defaultChecked={filters.inStockOnly} />
              <span>{t(locale, "filters.inStockOnly")}</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit">
              {t(locale, "filters.apply")}
            </button>
            <Link className="btn btn-secondary" href={basePath + (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "")}>
              {t(locale, "filters.clear")}
            </Link>
          </div>
        </form>
      </aside>

      <section>
        <div className="toolbar">
          <span className="result-count">
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>{result.total}</strong> {t(locale, "misc.results")}
          </span>
          <div className="spacer" />
          <form method="get" action={basePath} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.q && <input type="hidden" name="q" value={filters.q} />}
            {[...selectedBrands].map((brand) => (
              <input key={brand} type="hidden" name="brand" value={brand} />
            ))}
            {first(searchParams.min) && <input type="hidden" name="min" value={first(searchParams.min)} />}
            {first(searchParams.max) && <input type="hidden" name="max" value={first(searchParams.max)} />}
            {filters.inStockOnly && <input type="hidden" name="stock" value="1" />}
            <select id="sort" name="sort" defaultValue={filters.sort} aria-label={t(locale, "filters.sort")}>
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {t(locale, opt.labelKey)}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              {t(locale, "filters.apply")}
            </button>
          </form>
        </div>

        {result.products.length === 0 ? (
          <p className="empty-state">{t(locale, "search.noResults")}</p>
        ) : (
          <div className="phone-grid">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}

        {result.totalPages > 1 && (
          <nav className="pagination">
            {result.page > 1 && (
              <Link
                className="btn btn-secondary btn-sm"
                href={basePath + buildQuery(searchParams, { page: String(result.page - 1) })}
              >
                {t(locale, "misc.prev")}
              </Link>
            )}
            <span className="result-count">
              {t(locale, "misc.page")} {result.page} / {result.totalPages}
            </span>
            {result.page < result.totalPages && (
              <Link
                className="btn btn-secondary btn-sm"
                href={basePath + buildQuery(searchParams, { page: String(result.page + 1) })}
              >
                {t(locale, "misc.next")}
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
