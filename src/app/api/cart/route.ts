import { NextResponse, type NextRequest } from "next/server";
import { addToCart, setQuantity, removeFromCart } from "@/lib/cart";
import { safeRedirect } from "@/lib/redirect";

/**
 * Cart mutations.
 *
 * Accepts exactly three inputs: an action, a product id, and a quantity. There
 * is deliberately no price field, no title field, and no user field — the server
 * derives all three. See src/lib/cart.ts for why that matters once an LLM is
 * driving this endpoint in Phase 5.
 *
 * Plain form posts rather than fetch(), so the cart works with JavaScript off
 * and there is no client bundle for it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();

  const action = String(form.get("action") ?? "");
  const productId = Number.parseInt(String(form.get("product_id") ?? ""), 10);
  const quantity = Number.parseInt(String(form.get("quantity") ?? "1"), 10);

  if (Number.isFinite(productId)) {
    switch (action) {
      case "add":
        await addToCart(productId, Number.isFinite(quantity) ? quantity : 1);
        break;
      case "set":
        await setQuantity(productId, Number.isFinite(quantity) ? quantity : 1);
        break;
      case "remove":
        await removeFromCart(productId);
        break;
      default:
        break; // Unknown action: do nothing rather than guess.
    }
  }

  const target = safeRedirect(request, form.get("redirect_to") ?? request.headers.get("referer"), "/cart");
  // 303 forces the browser to follow up with GET, so a refresh cannot re-post.
  return NextResponse.redirect(target, 303);
}
