/**
 * Orders Service.
 *
 * Pure domain logic for creating and querying orders.
 * STRICT RULE: No imports from 'next/*' are allowed in this directory.
 */

import { randomUUID } from "node:crypto";
import { ensureSchema, query, queryOne } from "@/db/client";
import { type Cart } from "@/services/cart.service";

export interface OrderSummary {
  id: string;
  status: string;
  subtotal_cents: number;
  currency: string;
  created_at: string;
}

export interface CreatedOrder {
  id: string;
  cartId: string;
  subtotalCents: number;
  currency: string;
  lines: Array<{ productId: number; title: string; unitPriceCents: number; quantity: number }>;
}

export async function createPendingOrderFromCart(cart: Cart): Promise<CreatedOrder | null> {
  if (!cart.id || cart.lines.length === 0) return null;

  await ensureSchema();
  const orderId = randomUUID();

  await query("BEGIN");
  try {
    await query(
      `INSERT INTO orders (id, cart_id, status, subtotal_cents, currency)
       VALUES ($1, $2, 'pending', $3, $4)`,
      [orderId, cart.id, cart.subtotalCents, cart.currency],
    );

    for (const line of cart.lines) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, title_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, line.product_id, line.quantity, line.unit_price_cents, line.title],
      );
    }

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  return {
    id: orderId,
    cartId: cart.id,
    subtotalCents: cart.subtotalCents,
    currency: cart.currency,
    lines: cart.lines.map((line) => ({
      productId: line.product_id,
      title: line.title,
      unitPriceCents: line.unit_price_cents,
      quantity: line.quantity,
    })),
  };
}

export async function markOrderStatus(
  orderId: string,
  status: "paid" | "demo" | "cancelled",
  stripeSessionId?: string,
): Promise<void> {
  await ensureSchema();
  await query(
    `UPDATE orders
        SET status = $2,
            paid_at = CASE WHEN $2 IN ('paid', 'demo') THEN now() ELSE paid_at END,
            stripe_session_id = coalesce($3, stripe_session_id)
      WHERE id = $1`,
    [orderId, status, stripeSessionId ?? null],
  );
}

export async function getOrder(orderId: string): Promise<OrderSummary | null> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  return queryOne<OrderSummary>(
    "SELECT id, status, subtotal_cents, currency, created_at FROM orders WHERE id = $1",
    [orderId],
  );
}

export async function findOrderByStripeSession(sessionId: string): Promise<{ id: string; cart_id: string | null } | null> {
  await ensureSchema();
  return queryOne<{ id: string; cart_id: string | null }>(
    "SELECT id, cart_id FROM orders WHERE stripe_session_id = $1",
    [sessionId],
  );
}
