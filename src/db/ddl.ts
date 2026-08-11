/**
 * Schema DDL.
 *
 * Kept as a TypeScript string rather than a .sql file read at runtime: the app
 * is bundled, so import.meta.url-relative reads break under Turbopack, and a
 * loose .sql asset would not be traced into a serverless deployment either.
 * Embedding it means the schema travels with the code everywhere it runs.
 *
 * Applied idempotently on boot — every statement is CREATE ... IF NOT EXISTS.
 */

export const DDL = `-- Schema for the storefront. Applied idempotently on boot by src/db/client.ts.
--
-- Written as plain SQL rather than generated from an ORM because the catalog
-- query is filter-heavy and the search query is hand-written; hiding either
-- behind a query builder would cost clarity and buy nothing.

CREATE TABLE IF NOT EXISTS categories (
  id           serial PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  name_en      text NOT NULL,
  name_ar      text NOT NULL,
  -- The attribute spec for this category, mirrored from src/catalog/categories.ts.
  -- Drives filter UI and comparison-table column order without a code deploy.
  attr_schema  jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order   int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id                   serial PRIMARY KEY,
  sku                  text UNIQUE NOT NULL,
  slug                 text UNIQUE NOT NULL,
  category_id          int NOT NULL REFERENCES categories(id),
  brand                text,
  model                text,
  title                text NOT NULL,

  -- Integer minor units (EGP piastres). No float ever touches a price.
  price_cents          int NOT NULL,
  regular_price_cents  int,
  currency             char(3) NOT NULL DEFAULT 'EGP',
  on_sale              boolean NOT NULL DEFAULT false,

  in_stock             boolean NOT NULL DEFAULT true,
  stock                int,
  rating_avg           numeric(2,1),
  rating_count         int NOT NULL DEFAULT 0,

  attrs                jsonb NOT NULL DEFAULT '{}'::jsonb,

  description_en       text NOT NULL DEFAULT '',
  description_ar       text NOT NULL DEFAULT '',
  highlights_en        jsonb NOT NULL DEFAULT '[]'::jsonb,
  images               jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance           jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- 'simple' for identifiers: English stemming mangles model numbers and brand
  -- names ("Realme 15", "A1614H13"). 'english' only for prose.
  -- Both configs are named explicitly; the one-argument form is not IMMUTABLE
  -- and Postgres will refuse it in a generated column.
  search_tsv           tsvector GENERATED ALWAYS AS (
                         setweight(to_tsvector('simple',  coalesce(title, '')),   'A') ||
                         setweight(to_tsvector('simple',  coalesce(brand, '')),   'B') ||
                         setweight(to_tsvector('simple',  coalesce(model, '')),   'B') ||
                         setweight(to_tsvector('english', coalesce(description_en, '')), 'C')
                       ) STORED,

  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_tsv_idx      ON products USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS products_attrs_idx    ON products USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);
CREATE INDEX IF NOT EXISTS products_price_idx    ON products (price_cents);
CREATE INDEX IF NOT EXISTS products_brand_idx    ON products (brand);
CREATE INDEX IF NOT EXISTS products_ram_idx      ON products (((attrs->>'ram_gb')::int));
CREATE INDEX IF NOT EXISTS products_storage_idx  ON products (((attrs->>'storage_gb')::int));
CREATE INDEX IF NOT EXISTS products_refresh_idx  ON products (((attrs->>'refresh_rate_hz')::int));

CREATE TABLE IF NOT EXISTS product_variants (
  id             serial PRIMARY KEY,
  product_id     int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            text UNIQUE NOT NULL,
  color          text,
  storage_gb     int,
  ram_gb         int,
  price_cents    int NOT NULL,
  stock          int NOT NULL DEFAULT 0,
  image_url      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS variants_product_idx ON product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Cart
--
-- Server-side by design. The client holds nothing but an opaque cart id in a
-- cookie; quantities and prices live here. See docs/PLAN.md section 7.2 — the
-- AI agent in Phase 5 will propose cart changes, and it must not be able to
-- name a price or a user.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
  id          uuid PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id     uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  int  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    int  NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cart_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id                 uuid PRIMARY KEY,
  cart_id            uuid REFERENCES carts(id),
  email              text,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'paid', 'demo', 'cancelled')),
  subtotal_cents     int  NOT NULL,
  currency           char(3) NOT NULL DEFAULT 'EGP',
  stripe_session_id  text UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  paid_at            timestamptz
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        int  NOT NULL REFERENCES products(id),
  quantity          int  NOT NULL,
  -- Snapshots. An order must remain readable exactly as it was bought, even
  -- after the catalog reprices or the product is delisted.
  unit_price_cents  int  NOT NULL,
  title_snapshot    text NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
`;
