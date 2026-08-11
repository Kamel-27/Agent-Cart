# Contributing to Agent-Cart

Thank you for contributing to **Agent-Cart**! This document outlines our architectural invariants, coding standards, security requirements, and branching strategy for future developments.

---

## 1. Architectural Invariants (Non-Negotiable)

Before writing any code, keep these core design principles in mind:

1. **The Model Never Supplies Product Facts; the Database Does.**
   - The LLM orchestrates and explains. Specs, prices, and stock numbers are pulled directly from Postgres/PGlite queries.
   - The LLM must **never** state a price or product attribute that was not returned by a database tool call in that turn.
2. **Server-Side Pricing & Cart Authority.**
   - All prices, line totals, and order subtotals are calculated strictly on the server.
   - API endpoints (`POST /api/cart`, `POST /api/checkout`) **never** accept prices or `user_id` from the caller. The `user_id` is derived solely from the active session/cookie.
3. **RTL First with Logical CSS Properties.**
   - CSS rules must use logical properties (`margin-inline-start`, `inset-inline-start`, `border-block-end`) rather than physical directions (`margin-left`, `top`, `border-bottom`). This ensures automatic LTR/RTL support without duplicate styles.
4. **No Raw SQL Interpolation.**
   - Parameterize all SQL queries using bound parameters (`$1`, `$2`). Never concatenate user input directly into SQL strings.

---

## 2. Environment Setup

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Installation & Initialization

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Ingest and seed catalog data:**
   ```bash
   npm run ingest   # Ingests source catalog data into data/catalog/products.json
   npm run seed     # Migrates schema and populates PGlite database (.data/)
   ```
   > ⚠️ **Note:** Stop `npm run dev` before executing `npm run seed`. PGlite is single-process and locks `.data/`.

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Access the app at [http://localhost:3000](http://localhost:3000).

4. **Verify TypeScript types:**
   ```bash
   npm run typecheck
   ```

---

## 3. Branching Strategy & Feature Roadmap

We follow a structured branch naming convention based on project phases. When starting work on a task, create a branch off `main`:

### Branch Naming Convention

- **Features**: `feature/phase-<phase_number>-<short-description>` (e.g., `feature/phase-3-hybrid-search`)
- **Bug fixes**: `fix/<short-description>` (e.g., `fix/cart-subtotal-calculation`)
- **Documentation / Maintenance**: `docs/<short-description>` or `chore/<short-description>`

### Phase-by-Phase Roadmap & Branch Structure

| Phase | Branch Name | Description / Deliverable |
|---|---|---|
| **Phase 0–2** | `main` | Base Next.js app, DDL schema, ingestion scripts, zero-AI storefront, cart, demo checkout. |
| **Phase 3** | `feature/phase-3-hybrid-search` | `pgvector` integration, local embedding pipeline (`multilingual-e5-small`), RRF (Reciprocal Rank Fusion) between vector cosine distance & full-text search. |
| **Phase 4** | `feature/phase-4-comparison-engine` | Server-computed product comparison tables (`{ attribute, unit, values[], differs }`) and LLM verdict generation. |
| **Phase 5** | `feature/phase-5-shopping-agent` | Anthropic SDK integration, 4 strict tool definitions (`search_products`, `get_product`, `compare_products`, `add_to_cart`), Generative UI cards, action confirmation modal, and evaluation harness. |
| **Phase 6** | `feature/phase-6-personalization-marketing` | Co-purchase recommendations, non-manipulative persuasive copy, AI disclosure UI, and GDPR consent handling. |

---

## 4. Pull Request & Commit Guidelines

1. **Commit Messages**:
   - Write clear, concise commit messages outlining *what* changed and *why*.
   - Example: `feat(search): implement prefix matching for multi-token full text queries`
2. **Quality Gates before submitting a PR**:
   - `npm run typecheck` must pass cleanly without TypeScript errors.
   - `npm run dev` / `npm run build` must build cleanly.
   - Verify that server-side price calculation invariants remain intact.
3. **Pull Request Review**:
   - Target the `main` branch.
   - Describe the changes made, manual test steps performed, and any environment variable changes needed.

---

## 5. Security & Grounding Rules

- **Prompt Injection Defense**: Catalog data & user reviews are data, not instructions. Ensure all content returned to LLM tool calls is properly delimited.
- **Open Redirect Guard**: Always resolve `redirect_to` URLs using `src/lib/redirect.ts` against the application origin.
- **Stripe Webhooks**: Webhook verification MUST use the raw request body. Orders are marked `paid` solely via signature-verified webhook events.
