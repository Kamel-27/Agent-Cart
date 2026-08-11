/**
 * Catalog queries.
 *
 * SQL is written out rather than composed by an ORM because these are the
 * queries whose shape actually matters: a variable set of filter predicates, a
 * full-text rank, and facet counts that have to be computed against a partially
 * applied filter set. All of that is clearer as SQL than as builder calls.
 *
 * Every value is passed as a bound parameter. Nothing is interpolated into the
 * statement text — not sort keys, not filter values.
 */

import { ensureSchema, query, queryOne } from "@/db/client";

export interface ProductRow {
  id: number;
  sku: string;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  category_slug: string;
  category_name_en: string;
  category_name_ar: string;
  price_cents: number;
  regular_price_cents: number | null;
  currency: string;
  on_sale: boolean;
  in_stock: boolean;
  rating_avg: string | null;
  rating_count: number;
  attrs: Record<string, unknown>;
  description_en: string;
  description_ar: string;
  highlights_en: string[];
  images: string[];
}

export interface AttrSchemaEntry {
  key: string;
  kind: "number" | "enum" | "boolean" | "string";
  desc: string;
  unit?: string;
  values?: string[];
}

export interface CategoryRow {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  /** Ordered — see the note in scripts/seed.ts on why this is an array. */
  attr_schema: AttrSchemaEntry[];
  product_count: number;
}

export type SortKey = "relevance" | "price_asc" | "price_desc" | "newest";

export interface CatalogFilters {
  categorySlug?: string | undefined;
  q?: string | undefined;
  brands?: string[] | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
  inStockOnly?: boolean | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}

export interface CatalogResult {
  products: ProductRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  brandFacets: Array<{ brand: string; count: number }>;
  priceBounds: { min: number; max: number } | null;
}

const PRODUCT_COLUMNS = `
  p.id, p.sku, p.slug, p.title, p.brand, p.model,
  c.slug AS category_slug, c.name_en AS category_name_en, c.name_ar AS category_name_ar,
  p.price_cents, p.regular_price_cents, p.currency, p.on_sale,
  p.in_stock, p.rating_avg, p.rating_count,
  p.attrs, p.description_en, p.description_ar, p.highlights_en, p.images
`;

/**
 * Turn a user query into a prefix tsquery.
 *
 * `websearch_to_tsquery` alone requires whole-token matches, so "real" would not
 * find "Realme" — unacceptable for a search-as-you-type box. Building the query
 * manually with the `:*` prefix operator fixes that.
 *
 * Tokens are stripped to letters and digits (Latin and Arabic ranges) before
 * being concatenated, so no tsquery operator can survive from user input.
 */
function toPrefixTsQuery(raw: string): string | null {
  const tokens = raw
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{Letter}\p{Number}]/gu, ""))
    .filter((token) => token.length > 0)
    .slice(0, 8);
  if (tokens.length === 0) return null;
  return tokens.map((token) => `${token}:*`).join(" & ");
}

interface WherePart {
  sql: string;
  params: unknown[];
}

/** Build the shared WHERE clause. `skip` omits one filter for facet counting. */
function buildWhere(filters: CatalogFilters, skip?: "brand"): WherePart {
  const clauses: string[] = ["1 = 1"];
  const params: unknown[] = [];
  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.categorySlug) {
    clauses.push(`c.slug = ${add(filters.categorySlug)}`);
  }

  const tsquery = filters.q ? toPrefixTsQuery(filters.q) : null;
  if (tsquery) {
    clauses.push(`p.search_tsv @@ to_tsquery('simple', ${add(tsquery)})`);
  }

  if (skip !== "brand" && filters.brands && filters.brands.length > 0) {
    clauses.push(`p.brand = ANY(${add(filters.brands)})`);
  }

  if (filters.minPriceCents !== undefined) {
    clauses.push(`p.price_cents >= ${add(filters.minPriceCents)}`);
  }
  if (filters.maxPriceCents !== undefined) {
    clauses.push(`p.price_cents <= ${add(filters.maxPriceCents)}`);
  }
  if (filters.inStockOnly) {
    clauses.push(`p.in_stock = true`);
  }

  return { sql: clauses.join(" AND "), params };
}

/** ORDER BY is chosen from a fixed set — the sort key never reaches SQL as text. */
function orderBy(sort: SortKey | undefined, hasQuery: boolean, tsqueryParam: string | null): string {
  switch (sort) {
    case "price_asc":
      return "p.price_cents ASC, p.id ASC";
    case "price_desc":
      return "p.price_cents DESC, p.id ASC";
    case "newest":
      return "p.created_at DESC, p.id DESC";
    case "relevance":
    default:
      if (hasQuery && tsqueryParam) {
        return `ts_rank_cd(p.search_tsv, to_tsquery('simple', ${tsqueryParam})) DESC, p.price_cents ASC`;
      }
      // No query to rank against: in-stock first, then cheapest.
      return "p.in_stock DESC, p.price_cents ASC, p.id ASC";
  }
}

export async function listCategories(): Promise<CategoryRow[]> {
  await ensureSchema();
  return query<CategoryRow>(
    `SELECT c.id, c.slug, c.name_en, c.name_ar, c.attr_schema,
            count(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
     HAVING count(p.id) > 0
      ORDER BY c.sort_order`,
  );
}

export async function listProducts(filters: CatalogFilters): Promise<CatalogResult> {
  await ensureSchema();

  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 24));
  const offset = (page - 1) * perPage;

  const where = buildWhere(filters);
  const tsquery = filters.q ? toPrefixTsQuery(filters.q) : null;

  // The rank expression needs its own bound copy of the tsquery.
  const listParams = [...where.params];
  let rankParam: string | null = null;
  if (tsquery) {
    listParams.push(tsquery);
    rankParam = `$${listParams.length}`;
  }

  const order = orderBy(filters.sort, Boolean(tsquery), rankParam);

  listParams.push(perPage, offset);
  const limitParam = `$${listParams.length - 1}`;
  const offsetParam = `$${listParams.length}`;

  const products = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE ${where.sql}
      ORDER BY ${order}
      LIMIT ${limitParam} OFFSET ${offsetParam}`,
    listParams,
  );

  const totalRow = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${where.sql}`,
    where.params,
  );
  const total = totalRow?.n ?? 0;

  // Brand facets are counted with every filter EXCEPT brand applied, so that
  // selecting one brand does not make the others vanish from the list.
  const facetWhere = buildWhere(filters, "brand");
  const brandFacets = await query<{ brand: string; count: number }>(
    `SELECT p.brand, count(*)::int AS count
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${facetWhere.sql} AND p.brand IS NOT NULL
      GROUP BY p.brand
      ORDER BY count(*) DESC, p.brand ASC`,
    facetWhere.params,
  );

  const bounds = await queryOne<{ min: number; max: number }>(
    `SELECT min(p.price_cents)::int AS min, max(p.price_cents)::int AS max
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${facetWhere.sql}`,
    facetWhere.params,
  );

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    brandFacets,
    priceBounds: bounds && bounds.min !== null ? { min: bounds.min, max: bounds.max } : null,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  await ensureSchema();
  return queryOne<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1`,
    [slug],
  );
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  await ensureSchema();
  return queryOne<CategoryRow>(
    `SELECT c.id, c.slug, c.name_en, c.name_ar, c.attr_schema,
            (SELECT count(*)::int FROM products WHERE category_id = c.id) AS product_count
       FROM categories c WHERE c.slug = $1`,
    [slug],
  );
}

/** Related products: same category, closest price, excluding the product itself. */
export async function getRelatedProducts(product: ProductRow, limit = 4): Promise<ProductRow[]> {
  await ensureSchema();
  return query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE c.slug = $1 AND p.id <> $2 AND p.in_stock = true
      ORDER BY abs(p.price_cents - $3) ASC
      LIMIT $4`,
    [product.category_slug, product.id, product.price_cents, limit],
  );
}
