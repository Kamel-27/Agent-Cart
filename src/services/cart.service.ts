/**
 * Cart Service.
 *
 * Pure domain logic for cart operations.
 * STRICT RULE: No imports from 'next/*' are allowed in this directory.
 * Cart identification (e.g. cookies, session tokens) is handled by the caller.
 */

import { randomUUID } from "node:crypto";
import { ensureSchema, query, queryOne } from "@/db/client";

export const CART_COOKIE = "cart_id";
export const MAX_QUANTITY = 99;

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

export const EMPTY_CART: Cart = {
  id: null,
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  currency: "EGP",
};

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function createCartRecord(): Promise<string> {
  await ensureSchema();
  const id = randomUUID();
  await query("INSERT INTO carts (id) VALUES ($1)", [id]);
  return id;
}

export async function ensureCartRecord(existingId: string | null): Promise<{ cartId: string; created: boolean }> {
  await ensureSchema();

  if (existingId && isValidUuid(existingId)) {
    const row = await queryOne<{ id: string }>("SELECT id FROM carts WHERE id = $1", [existingId]);
    if (row) return { cartId: row.id, created: false };
  }

  const id = await createCartRecord();
  return { cartId: id, created: true };
}

export async function getCartById(cartId: string | null): Promise<Cart> {
  if (!cartId || !isValidUuid(cartId)) return EMPTY_CART;

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

export async function getCartCountById(cartId: string | null): Promise<number> {
  if (!cartId || !isValidUuid(cartId)) return 0;
  await ensureSchema();
  const row = await queryOne<{ n: number }>(
    "SELECT coalesce(sum(quantity), 0)::int AS n FROM cart_items WHERE cart_id = $1",
    [cartId],
  );
  return row?.n ?? 0;
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

export async function addToCartByCartId(cartId: string, productId: number, quantity = 1): Promise<void> {
  await ensureSchema();
  const qty = clampQuantity(quantity);

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

export async function setQuantityByCartId(cartId: string, productId: number, quantity: number): Promise<void> {
  if (!cartId || !isValidUuid(cartId)) return;
  await ensureSchema();

  if (quantity <= 0) {
    await removeFromCartByCartId(cartId, productId);
    return;
  }

  await query("UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2", [
    cartId,
    productId,
    clampQuantity(quantity),
  ]);
  await touchCart(cartId);
}

export async function removeFromCartByCartId(cartId: string, productId: number): Promise<void> {
  if (!cartId || !isValidUuid(cartId)) return;
  await ensureSchema();
  await query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cartId, productId]);
  await touchCart(cartId);
}

export async function clearCartByCartId(cartId: string): Promise<void> {
  if (!cartId || !isValidUuid(cartId)) return;
  await ensureSchema();
  await query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
}

async function touchCart(cartId: string): Promise<void> {
  await query("UPDATE carts SET updated_at = now() WHERE id = $1", [cartId]);
}
