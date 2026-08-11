/**
 * Next.js Orders Adapter.
 *
 * Delegates order operations to @/services/orders.service.
 */

import { getCart } from "@/lib/cart";
import {
  createPendingOrderFromCart,
  markOrderStatus as serviceMarkOrderStatus,
  getOrder as serviceGetOrder,
  findOrderByStripeSession as serviceFindOrderByStripeSession,
  type OrderSummary,
  type CreatedOrder,
} from "@/services/orders.service";

export type { OrderSummary, CreatedOrder };

export async function createPendingOrder(): Promise<CreatedOrder | null> {
  const cart = await getCart();
  return createPendingOrderFromCart(cart);
}

export async function markOrderStatus(
  orderId: string,
  status: "paid" | "demo" | "cancelled",
  stripeSessionId?: string,
): Promise<void> {
  return serviceMarkOrderStatus(orderId, status, stripeSessionId);
}

export async function getOrder(orderId: string): Promise<OrderSummary | null> {
  return serviceGetOrder(orderId);
}

export async function findOrderByStripeSession(sessionId: string): Promise<{ id: string; cart_id: string | null } | null> {
  return serviceFindOrderByStripeSession(sessionId);
}
