/**
 * Client for the public WooCommerce Store API.
 *
 * This is the same read-only endpoint the site's own storefront JavaScript
 * calls. We pull facts only — identifiers, prices, stock, taxonomy, and the raw
 * text we run extraction over. Source prose and imagery are never copied into
 * the published catalog; see docs/INGESTION.md.
 */

export interface SourcePrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}

export interface SourceTerm {
  id: number;
  name: string;
  slug: string;
  default?: boolean;
}

export interface SourceAttribute {
  id: number;
  name: string;
  taxonomy: string;
  has_variations: boolean;
  terms: SourceTerm[];
}

export interface SourceCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  count?: number;
}

export interface SourceProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: SourcePrices;
  average_rating: string;
  review_count: number;
  images: { id: number; src: string; alt: string }[];
  categories: SourceCategory[];
  brands?: { id: number; name: string; slug: string }[];
  attributes: SourceAttribute[];
  is_in_stock: boolean;
  low_stock_remaining: number | null;
}

const USER_AGENT =
  "agent-cart-ingest/0.1 (catalog research; contact: set CONTACT_EMAIL in .env)";

export class StoreApiClient {
  constructor(
    private readonly baseUrl: string,
    /** Delay between requests. The source is a small shop on shared hosting;
     *  there is no reason to hit it faster than a human browsing would. */
    private readonly delayMs = 700,
  ) {}

  private async get<T>(path: string, params: Record<string, string | number> = {}): Promise<{ body: T; headers: Headers }> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`GET ${url.pathname}${url.search} -> ${res.status} ${res.statusText}`);
    }

    return { body: (await res.json()) as T, headers: res.headers };
  }

  async fetchCategories(): Promise<SourceCategory[]> {
    const { body } = await this.get<SourceCategory[]>("/wp-json/wc/store/v1/products/categories", {
      per_page: 100,
    });
    return body;
  }

  /** Pull every product, page by page, reporting progress as it goes. */
  async fetchAllProducts(onProgress?: (fetched: number, total: number) => void): Promise<SourceProduct[]> {
    const perPage = 50;
    const first = await this.get<SourceProduct[]>("/wp-json/wc/store/v1/products", {
      per_page: perPage,
      page: 1,
    });

    const total = Number(first.headers.get("x-wp-total") ?? first.body.length);
    const totalPages = Number(first.headers.get("x-wp-totalpages") ?? 1);
    const products = [...first.body];
    onProgress?.(products.length, total);

    for (let page = 2; page <= totalPages; page++) {
      await sleep(this.delayMs);
      const { body } = await this.get<SourceProduct[]>("/wp-json/wc/store/v1/products", {
        per_page: perPage,
        page,
      });
      if (body.length === 0) break;
      products.push(...body);
      onProgress?.(products.length, total);
    }

    return products;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The Store API reports prices as integer strings in the currency's minor unit,
 * with the exponent in `currency_minor_unit`. For EGP that is piastres. We keep
 * integer minor units end-to-end and never introduce a float.
 */
export function priceToMinorUnits(raw: string, minorUnit: number): number | null {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return null;
  // Normalize to 2 decimal places, which is what our schema stores.
  if (minorUnit === 2) return value;
  if (minorUnit < 2) return value * 10 ** (2 - minorUnit);
  return Math.round(value / 10 ** (minorUnit - 2));
}
