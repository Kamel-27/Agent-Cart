# Storefront (Phase 2)

A working store with **no AI in it at all**: browse, filter, search, cart,
checkout. This is the foundation Phase 5's shopping agent calls into — if the
store doesn't work without the assistant, the assistant has nothing to stand on.

```bash
npm install
npm run ingest      # only if data/catalog/products.json is missing
npm run seed
npm run dev         # http://localhost:3000
```

> ⚠️ **Stop the dev server before running `npm run seed`.** The default database
> is PGlite, which is single-process — the running server holds the data
> directory and the seed will block partway through. This restriction disappears
> the moment you set `DATABASE_URL` to a real Postgres.

## Routes

| Route | What it does |
|---|---|
| `/` | Category tiles and a featured row |
| `/c` | All products, filterable |
| `/c/[slug]` | One category, filterable |
| `/p/[slug]` | Product detail, spec table, related products |
| `/search?q=` | Full-text search with prefix matching |
| `/cart` | Cart with quantity editing |
| `/checkout/success` | Order confirmation |
| `POST /api/cart` | Add / set quantity / remove |
| `POST /api/checkout` | Stripe session, or demo order |
| `POST /api/webhooks/stripe` | The only path that marks an order `paid` |
| `POST /api/locale` | Language switch |

## Decisions worth knowing

### No ORM

`PLAN.md` named Drizzle. It was installed, then removed. The two queries that
matter here — a listing with a variable set of filter predicates, and facet
counts computed against a *partially applied* filter set — are clearer written
out than assembled through a builder, and the builder would have added an
adapter layer to debug across two drivers. `src/db/client.ts` is a ~20-line
typed wrapper over `pg` and PGlite; everything else is SQL with bound
parameters. Nothing is interpolated into statement text, including sort keys.

### PGlite by default

No `DATABASE_URL` means the app runs against a file-backed Postgres compiled to
WASM, so `npm run dev` works with zero infrastructure. It is real Postgres — the
same DDL, the same generated `tsvector` column, the same JSONB operators — so
switching to Supabase or Neon later is a connection string, not a rewrite.

The cost is the single-process restriction above. Move to hosted Postgres as
soon as more than one thing needs the database at once — and Phase 3 needs
`pgvector` anyway.

### The schema lives in `src/db/ddl.ts`, not a `.sql` file

It started as `ddl.sql` read at runtime. That breaks under Turbopack
(`import.meta.url`-relative reads resolve into the bundle) and would break again
on a serverless deploy, where a loose `.sql` asset is not traced into the
bundle. As a TypeScript string it travels with the code everywhere it runs.

### RTL first, Arabic default

`dir` is set once on `<html>` and every rule in `globals.css` uses **logical**
properties — `margin-inline-start`, `border-block-end`, `inset-inline-start` —
so the whole layout mirrors with no RTL-specific CSS anywhere. That is the
entire reason to do it on day one: retrofitting means auditing every physical
property in a grown codebase and deciding one by one whether it should flip.

Locale is a cookie, not a route prefix. Route-based i18n (`/ar/…`, `/en/…`) is
the better long-term answer for SEO, but it touches every link in the app and
deserves its own deliberate change rather than being smuggled in here.

### Zero client JavaScript

Filters, sort, add-to-cart, quantity updates, and the language switch are all
plain HTML forms. Consequences: the URL is the state, so every filtered view is
shareable and the back button behaves; the store works with JS disabled; and
there is no client bundle for any of it. `POST` handlers reply `303`, so a
refresh cannot re-submit.

### Search

Postgres full-text with a **prefix** tsquery built from sanitized tokens, so
"real" finds "Realme" — `websearch_to_tsquery` alone requires whole-token
matches and would not. Tokens are stripped to letters and digits (Latin and
Arabic ranges) before assembly, so no tsquery operator can survive from user
input. `simple` config for title/brand/model because English stemming mangles
model numbers; `english` for prose.

Multi-token queries AND together: `sam a17` → 4 results.

## The invariant this phase exists to establish

**The client may send a product id and a quantity. Nothing else.**

Prices, line totals, and the subtotal are read from the database and recomputed
on every request (`src/lib/cart.ts`). There is no code path that accepts a price
from the caller. Verified:

```
POST /api/cart  action=set  product_id=205  quantity=2
                price=1  unit_price_cents=1  line_total_cents=1  price_cents=1
  -> subtotal unchanged at 12,810 EGP
```

This matters now, and it matters much more in Phase 5, when an LLM is the thing
posting to this endpoint. A model that could state a price could invent one.

Two related guards:

- **`user_id` is never accepted from the client.** The cart is keyed by an
  opaque UUID in an `httpOnly` cookie.
- **`redirect_to` is resolved against our own origin** (`src/lib/redirect.ts`).
  Both that field and the `Referer` header are attacker-controlled; using either
  directly is a textbook open redirect. Verified: `redirect_to=https://evil.example/pwn`
  → `http://localhost:3000/cart`.

## Payments

Stripe **hosted** Checkout, so card data never touches this server and the
project stays out of PCI scope. Line items are built from the server-priced
cart; the browser never sends an amount.

`/api/webhooks/stripe` is the only place an order becomes `paid`, and it
verifies the signature against the **raw** request body. The success redirect is
not proof of payment — it is a URL a shopper can visit, edit, or share. The cart
is emptied on the webhook, not on the redirect, so an abandoned checkout leaves
it intact.

Without `STRIPE_SECRET_KEY`, checkout records a `demo` order and says so on the
confirmation page in both languages.

## Verified end to end

| Check | Result |
|---|---|
| All 12 routes | 200 |
| Production build | passes, 12 routes |
| `tsc --noEmit` | clean |
| Locale default | `<html lang="ar" dir="rtl">`, prices `٦٬٤٠٥ ج.م.‏` |
| Locale switch | `<html lang="en" dir="ltr">`, prices `EGP 6,405` |
| Brand + price filter | `brand=Realme&max=15000` → 17 products, all Realme |
| Prefix search | `real` → 24, `xiao` → 24, `sam a17` → 4, `zzzqqq` → empty state |
| Sort | `price_desc` → 100,695 / 99,750 / 98,700 EGP |
| Cart | 2 × 6,405 = 12,810 EGP; qty→3 = 19,215 EGP |
| Price injection | ignored |
| Open redirect | neutralized |
| Demo checkout | order created, cart emptied, Arabic notice shown |

## Known gaps

- **No product images.** Every card and product page shows a placeholder. The
  ingestion pipeline leaves `images` empty on purpose (`docs/INGESTION.md`);
  fill it from manufacturer press kits.
- **No auth.** Carts are anonymous and cookie-scoped. Orders have an `email`
  column that nothing populates yet — Stripe Checkout collects it, so wiring it
  through the webhook is the next small step.
- **No variant support.** 31 products are WooCommerce `variable` type; the
  pipeline flattens to the default variant, so colour/storage options are
  separate listings or missing. Needs a `product_variants` table.
- **No attribute facets in the UI.** `categories.attr_schema` is stored ordered
  and ready — the filter sidebar only uses brand, price, and stock so far.
- **No tax, shipping, or returns.** Real commerce needs all three before money
  changes hands.
