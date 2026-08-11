/**
 * Next.js Cart Adapter.
 *
 * Reads/writes HTTP-only cookies and delegates pure cart domain logic to @/services/cart.service.
 */

import { cookies } from "next/headers";
import {
  isValidUuid,
  createCartRecord,
  getCartById,
  getCartCountById,
  addToCartByCartId,
  setQuantityByCartId,
  removeFromCartByCartId,
  clearCartByCartId,
  type CartLine,
  type Cart,
} from "@/services/cart.service";

export type { CartLine, Cart };
export const CART_COOKIE = "cart_id";

/** Read-only cookie lookup. */
export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CART_COOKIE)?.value;
  if (!value) return null;
  return isValidUuid(value) ? value : null;
}

/** Route Handlers and Server Actions cookie helper. */
export async function ensureCart(): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    return existing;
  }

  const id = await createCartRecord();
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

export async function getCart(): Promise<Cart> {
  const cartId = await readCartId();
  return getCartById(cartId);
}

export async function getCartCount(): Promise<number> {
  const cartId = await readCartId();
  return getCartCountById(cartId);
}

export async function addToCart(productId: number, quantity = 1): Promise<void> {
  const cartId = await ensureCart();
  return addToCartByCartId(cartId, productId, quantity);
}

export async function setQuantity(productId: number, quantity: number): Promise<void> {
  const cartId = await readCartId();
  if (!cartId) return;
  return setQuantityByCartId(cartId, productId, quantity);
}

export async function removeFromCart(productId: number): Promise<void> {
  const cartId = await readCartId();
  if (!cartId) return;
  return removeFromCartByCartId(cartId, productId);
}

export async function clearCart(cartId: string): Promise<void> {
  return clearCartByCartId(cartId);
}
