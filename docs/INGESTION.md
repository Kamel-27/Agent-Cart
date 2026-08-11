# Catalog ingestion

Builds a normalized, 254-product Egyptian-market catalog to develop against.

```bash
cp .env.example .env
npm install
npm run ingest          # fetch, then build
```

Two stages, deliberately separate so extraction can be re-tuned dozens of times
without touching the source site again:

```
npm run fetch           data/raw/products.json      (gitignored)
npm run build:catalog   data/catalog/products.json  (committed)
                        data/catalog/coverage.json
```

---

## What this takes, and what it does not

The source is [elhashimstore.com](https://elhashimstore.com), a WooCommerce
store whose Store API — the same read-only endpoint its own storefront
JavaScript calls — is public. No scraping, no HTML parsing, no anti-bot to work
around. `robots.txt` disallows only `/wp-admin/` and cart-action URLs.

The distinction that matters is **facts versus expression**:

| Taken | Not taken |
|---|---|
| Brand, model, storage, RAM, colour | Their product descriptions |
| Prices, sale prices, stock status | Their product photography |
| Category taxonomy | Their page copy or layout |

Facts are not copyrightable. Descriptions and images are — they are someone's
authored work, and copying them into a competing storefront is infringement
regardless of how easy the API makes it.

So the pipeline reads their text **only as input to fact extraction**, and never
reproduces it. Two mechanisms enforce that:

1. **Description writing is a separate pass** that receives only the extracted
   attributes. The source text is not in its context at all, so it has nothing to
   paraphrase. (`src/ingest/describe.ts`)
2. **`images` is always `[]`.** Fill it from manufacturer press kits — Samsung,
   Apple, Realme, Xiaomi, Infinix and Anker all publish them — or your own
   photography.

Their ToS very likely prohibits automated extraction. That is a contract question
separate from copyright, and it applies even though `robots.txt` permits
crawling. Treat this catalog as **development seed data**, and replace it with a
real supplier feed or your own entered stock before you take money.

The fetch stage rate-limits itself to one request every 700ms and identifies
itself in the User-Agent. Leave both alone.

---

## Pipeline

```
raw product
  │
  ├─ mapSourceCategory()    leaf slug -> canonical category
  │                         (source leaves are brands: "realme" -> smartphones)
  │
  ├─ runHeuristics()        AUTHORITATIVE. Two deterministic sources:
  │                           1. WooCommerce pa_ram / pa_storage / pa_color
  │                           2. title regexes
  │
  ├─ extractAttributes()    PASS A. Model fills only what heuristics left null.
  │                         Reads source text; emits facts, never prose.
  │
  ├─ writeDescription()     PASS B. Sees ONLY the attributes from pass A.
  │
  └─ catalog row            validated against the category's schema
```

**Heuristics always win.** The model is never allowed to overwrite a value that
deterministic parsing already resolved, and is told which fields are already
known so it does not waste tokens re-deriving them.

### Why the title parsing is not a one-line regex

Titles interleave storage and RAM in either order with no consistent separator:

```
Realme 15 Dual SIM – 256GB, 12GB RAM, 5G - Titanium
Vivo Y500 - 8GB RAM - 256GB - Blue
Infinix Hot 70 Dual Sim – 128GB, 6GB Ram,4G
```

A proximity window around each size figure fails on the third case — "Ram" sits
close to *both* numbers, so `128GB` gets tagged as RAM and the storage value is
lost entirely. This cost `storage_gb` 91 percentage points of coverage on the
first run. The fix is to match the RAM token together with its own number,
remove that span, and treat what remains as storage.

---

## Extraction providers

Set `LLM_PROVIDER` in `.env`:

| Value | Cost | What you get |
|---|---|---|
| `none` | free | Heuristics only. `storage_gb` 99%, `ram_gb` 95% on phones; the deeper fields (chipset, display, battery, cameras) stay `null`. Deterministic, offline, CI-safe. |
| `gemini` | free tier | Set `GEMINI_API_KEY`. Good Arabic. Lower `INGEST_CONCURRENCY` if you hit rate limits. |
| `anthropic` | paid | Set `ANTHROPIC_API_KEY`. Native structured outputs and the best extraction accuracy. |

Both SDKs are optional dependencies — `LLM_PROVIDER=none` runs with neither
installed.

Two things the pipeline does that matter for cost and correctness:

- **The system prompt carries a cache breakpoint** and is byte-identical across
  every product in a run. Nothing per-product may appear above it.
- **The first request runs alone before the pool fans out**
  (`mapWithConcurrency`). A cache entry only becomes readable once the request
  that wrote it starts responding, so firing N identical-prefix requests at once
  would make all N miss and all N pay the write premium. One serial request
  first turns that into one write and N−1 reads.

---

## Output shape

```jsonc
{
  "sku": "REA-PH-8943",          // minted here; source leaves sku empty on all 254
  "slug": "realme-15-dual-sim-256gb-12gb-ram-5g-titanium-8943",
  "category": "smartphones",
  "brand": "Realme",
  "model": "15",
  "title": "Realme 15 Dual SIM – 256GB, 12GB RAM, 5G – Titanium",
  "price_cents": 2029900,        // EGP piastres — integer minor units, never a float
  "currency": "EGP",
  "attrs": {
    "storage_gb": 256,
    "ram_gb": 12,
    "has_5g": true,
    "chipset": null              // explicit null = unknown, distinct from "absent"
  },
  "description_en": "...",       // generated from attrs alone
  "description_ar": "...",
  "images": [],                  // intentionally empty
  "provenance": {
    "attrs_from_heuristics": ["ram_gb", "storage_gb", "color", "has_5g"],
    "attrs_from_model": [],
    "copy_generated_by": "template",
    "extraction_error": null
  }
}
```

`provenance` is not decoration. When a spec turns out to be wrong you need to
know whether a regex, a model, or the source produced it — and the eval harness
in `PLAN.md` §9 uses it to assert that no spec reached a shopper without a
traceable origin.

### Currency correction

`PLAN.md` §3 assumed USD. The source prices in **EGP**, and the Store API reports
them as integer strings in the currency's minor unit with the exponent in
`currency_minor_unit`. `price_cents` therefore holds **piastres**. Integer minor
units are carried end-to-end; no float ever touches a price.

---

## Coverage

`data/catalog/coverage.json` reports the percentage of products with a non-null
value for every field, per category. This is the number that predicts whether
comparison and search will actually work — a comparison table over 20%-populated
attributes is a table of dashes.

Current, with `LLM_PROVIDER=none`:

| Category | n | Well covered | Empty until an LLM pass runs |
|---|---|---|---|
| smartphones | 184 | `storage_gb` 99%, `ram_gb` 95%, `has_5g` 43% | chipset, display, battery, cameras |
| tablets | 8 | `ram_gb` 63% | most |
| earbuds | 39 | — | all |
| smartwatches | 13 | — | all |
| powerbanks | 5 | `capacity_mah` 100% | output, ports |
| tvs | 4 | — | most |
| gaming | 5 | — | all |

Earbuds and smartwatches are empty because their titles carry no specs — those
categories are entirely dependent on the extraction pass. That is the honest
argument for running one.

---

## Known limitations

- **31 products are WooCommerce `variable` type** with per-variant colour and
  storage. We currently flatten to the default variant. Real variant support
  means a `product_variants` table, and that is a Phase 2 schema decision.
- **`stock` is usually `null`.** The Store API exposes `low_stock_remaining`
  only when the shop enables it; `in_stock` is a reliable boolean either way.
- **`model` parsing is approximate.** "Realme 15" yields `"15"`, which is
  correct-but-terse. Worth a human pass before this becomes a facet.
- **Arabic descriptions are generated, not reviewed.** Have a native speaker
  read a sample before any of it goes in front of customers.
