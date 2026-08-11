import { NextResponse, type NextRequest } from "next/server";
import { createPendingOrder, markOrderStatus } from "@/lib/orders";
import { clearCart } from "@/lib/cart";
import { query } from "@/db/client";

/**
 * Checkout.
 *
 * With STRIPE_SECRET_KEY set, this creates a hosted Stripe Checkout session and
 * hands the shopper off. Card details never touch this server, which keeps the
 * project entirely out of PCI scope (docs/PLAN.md §7.3).
 *
 * Without the key, it records a clearly-labelled demo order instead. That is not
 * a shortcut — it means the whole storefront is runnable and reviewable by
 * someone with no Stripe account, which is the difference between a project
 * someone can try and one they have to sign up for first.
 *
 * Line items are built from the server-priced cart. The browser never sends an
 * amount.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;

  const order = await createPendingOrder();
  if (!order) {
    return NextResponse.redirect(new URL("/cart", origin), 303);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    await markOrderStatus(order.id, "demo");
    await clearCart(order.cartId);
    return NextResponse.redirect(new URL(`/checkout/success?order=${order.id}&demo=1`, origin), 303);
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe expects the amount in the currency's minor unit, which is what
      // we already store — no conversion, no rounding.
      line_items: order.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: line.unitPriceCents,
          product_data: { name: line.title },
        },
      })),
      success_url: `${origin}/checkout/success?order=${order.id}`,
      cancel_url: `${origin}/cart`,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
    });

    await query("UPDATE orders SET stripe_session_id = $2 WHERE id = $1", [order.id, session.id]);

    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    await markOrderStatus(order.id, "cancelled");
    return NextResponse.redirect(new URL("/cart?error=checkout", origin), 303);
  }
}
