/**
 * Cart.
 *
 * The single invariant this file exists to enforce:
 *
 *     THE CLIENT MAY SEND A PRODUCT ID AND A QUANTITY. NOTHING ELSE.
 *
 * Prices, line totals, and the subtotal are read from the database and computed
 * here on every request. There is no code path that accepts a price from the
 * caller, and there must never be one — Phase 5 puts an LLM behind this API, and
 * an LLM that could state a price could invent one (docs/PLAN.md §1, §7.2).
 *
 * The browser holds an opaque cart UUID in a cookie and nothing else, so a user
 * editing their own cookies can at most point at somebody else's cart id, which
 * is why the id is a random UUID rather than a sequential number.
 */

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSchema, query, queryOne } from "@/db/client";

export const CART_COOKIE = "cart_id";
const MAX_QUANTITY = 99;

export interface CartLine {
  product_id: number;
  slug: string;
  title: string;
  brand: string | null;
  currency: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  in_stock: boolean;
  images: string[];
}

export interface Cart {
  id: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string;
}

const EMPTY_CART: Cart = {
  id: null,
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  currency: "EGP",
};

/** Read-only. Server Components cannot set cookies, so this never creates one. */
export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CART_COOKIE)?.value;
  if (!value) return null;
  // Reject anything that is not a UUID before it reaches a SQL parameter of
  // type uuid, which would otherwise throw on malformed input.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

/** For Route Handlers and Server Actions, which may set cookies. */
export async function ensureCart(): Promise<string> {
  await ensureSchema();
  const existing = await readCartId();

  if (existing) {
    const row = await queryOne<{ id: string }>("SELECT id FROM carts WHERE id = $1", [existing]);
    if (row) return row.id;
  }

  const id = randomUUID();
  await query("INSERT INTO carts (id) VALUES ($1)", [id]);

  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return id;
}

/**
 * Load the cart, pricing every line from the products table at read time.
 *
 * Prices are joined live rather than stored on cart_items on purpose: a cart
 * that sat for a week should reflect today's price, and the shopper should see
 * that before paying. The price is frozen only at order time, into
 * order_items.unit_price_cents.
 */
export async function getCart(): Promise<Cart> {
  const cartId = await readCartId();
  if (!cartId) return EMPTY_CART;

  await ensureSchema();

  const lines = await query<CartLine>(
    `SELECT ci.product_id,
            p.slug, p.title, p.brand, p.currency, p.in_stock, p.images,
            ci.quantity,
            p.price_cents AS unit_price_cents,
            (p.price_cents * ci.quantity) AS line_total_cents
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at ASC`,
    [cartId],
  );

  const subtotalCents = lines.reduce((sum, line) => sum + line.line_total_cents, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    id: cartId,
    lines,
    itemCount,
    subtotalCents,
    currency: lines[0]?.currency ?? "EGP",
  };
}

/** Item count only — used by the header on every page. */
export async function getCartCount(): Promise<number> {
  const cartId = await readCartId();
  if (!cartId) return 0;
  await ensureSchema();
  const row = await queryOne<{ n: number }>(
    "SELECT coalesce(sum(quantity), 0)::int AS n FROM cart_items WHERE cart_id = $1",
    [cartId],
  );
  return row?.n ?? 0;
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

export async function addToCart(productId: number, quantity = 1): Promise<void> {
  const cartId = await ensureCart();
  const qty = clampQuantity(quantity);

  // Existence and stock are checked server-side; a client cannot add a product
  // that is delisted or out of stock by posting its id directly.
  const product = await queryOne<{ id: number; in_stock: boolean }>(
    "SELECT id, in_stock FROM products WHERE id = $1",
    [productId],
  );
  if (!product || !product.in_stock) return;

  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id) DO UPDATE
       SET quantity = least($4, cart_items.quantity + EXCLUDED.quantity)`,
    [cartId, productId, qty, MAX_QUANTITY],
  );
  await touchCart(cartId);
}

export async function setQuantity(productId: number, quantity: number): Promise<void> {
  const cartId = await readCartId();
  if (!cartId) return;
  await ensureSchema();

  if (quantity <= 0) {
    await removeFromCart(productId);
    return;
  }

  await query("UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2", [
    cartId,
    productId,
    clampQuantity(quantity),
  ]);
  await touchCart(cartId);
}

export async function removeFromCart(productId: number): Promise<void> {
  const cartId = await readCartId();
  if (!cartId) return;
  await ensureSchema();
  await query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cartId, productId]);
  await touchCart(cartId);
}

export async function clearCart(cartId: string): Promise<void> {
  await ensureSchema();
  await query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
}

async function touchCart(cartId: string): Promise<void> {
  await query("UPDATE carts SET updated_at = now() WHERE id = $1", [cartId]);
}
