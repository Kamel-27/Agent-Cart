import { NextResponse, type NextRequest } from "next/server";
import { findOrderByStripeSession, markOrderStatus } from "@/lib/orders";
import { clearCart } from "@/lib/cart";

/**
 * Stripe webhook — the ONLY place an order becomes `paid`.
 *
 * The browser redirect to /checkout/success is not proof of payment: it is a URL
 * the shopper can visit, edit, or share. Fulfilment must hang off a
 * signature-verified server-to-server event, never off a redirect.
 *
 * The raw request body is required for signature verification — parsing and
 * re-serializing the JSON changes the bytes and every signature check fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id ?? session.client_reference_id ?? null;

      const order = orderId ? { id: orderId, cart_id: null } : await findOrderByStripeSession(session.id);

      if (order) {
        await markOrderStatus(order.id, "paid", session.id);
        // Empty the cart only once payment is confirmed, so an abandoned
        // checkout leaves the shopper's cart intact.
        const found = await findOrderByStripeSession(session.id);
        if (found?.cart_id) await clearCart(found.cart_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook rejected:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
