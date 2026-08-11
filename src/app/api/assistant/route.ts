import { NextResponse } from "next/server";
import {
  SHOPPING_ASSISTANT_PROMPT,
  AI_TOOLS_SCHEMA,
} from "@/services/ai.service";
import {
  listProducts,
  getProductById,
  getProductBySlug,
} from "@/services/catalog.service";
import { generateProsCons } from "@/lib/pros-cons";

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const toolCall: ToolCall = body.toolCall;

    if (!toolCall || !toolCall.name) {
      return NextResponse.json({ error: "Missing toolCall payload" }, { status: 400 });
    }

    let result: unknown = null;

    switch (toolCall.name) {
      case "search_smartphones": {
        const query = String(toolCall.arguments.query || "");
        const brand = toolCall.arguments.brand ? String(toolCall.arguments.brand) : undefined;
        const minPrice = typeof toolCall.arguments.min_price_egp === "number" ? toolCall.arguments.min_price_egp * 100 : undefined;
        const maxPrice = typeof toolCall.arguments.max_price_egp === "number" ? toolCall.arguments.max_price_egp * 100 : undefined;
        const limit = typeof toolCall.arguments.limit === "number" ? toolCall.arguments.limit : 8;

        const res = await listProducts({
          categorySlug: "smartphones",
          q: query,
          brands: brand ? [brand] : undefined,
          minPriceCents: minPrice,
          maxPriceCents: maxPrice,
          perPage: limit,
        });

        result = {
          total: res.total,
          products: res.products.map((p) => ({
            id: p.id,
            sku: p.sku,
            slug: p.slug,
            title: p.title,
            brand: p.brand,
            price_egp: p.price_cents / 100,
            in_stock: p.in_stock,
            image: p.images[0] ?? null,
            attrs: p.attrs,
          })),
        };
        break;
      }

      case "get_phone_details": {
        let p = null;
        if (typeof toolCall.arguments.product_id === "number") {
          p = await getProductById(toolCall.arguments.product_id);
        } else if (typeof toolCall.arguments.slug === "string") {
          p = await getProductBySlug(toolCall.arguments.slug);
        }

        if (!p) {
          result = { error: "Smartphone not found" };
        } else {
          result = {
            id: p.id,
            title: p.title,
            brand: p.brand,
            price_egp: p.price_cents / 100,
            in_stock: p.in_stock,
            attrs: p.attrs,
            description: p.description_ar || p.description_en,
            pros_cons: generateProsCons(p.attrs),
          };
        }
        break;
      }

      case "compare_phones": {
        const rawIds = Array.isArray(toolCall.arguments.product_ids)
          ? toolCall.arguments.product_ids
          : [];
        const ids = rawIds.filter((id): id is number => typeof id === "number").slice(0, 4);

        const products = (
          await Promise.all(ids.map((id) => getProductById(id)))
        ).filter((p): p is NonNullable<typeof p> => p !== null);

        result = {
          compared: products.map((p) => ({
            id: p.id,
            title: p.title,
            price_egp: p.price_cents / 100,
            attrs: p.attrs,
            pros_cons: generateProsCons(p.attrs),
          })),
        };
        break;
      }

      case "add_to_cart": {
        const productId = typeof toolCall.arguments.product_id === "number" ? toolCall.arguments.product_id : null;
        const qty = typeof toolCall.arguments.quantity === "number" ? toolCall.arguments.quantity : 1;

        if (!productId) {
          result = { error: "Invalid product_id" };
        } else {
          const product = await getProductById(productId);
          if (!product) {
            result = { error: "Product not found" };
          } else {
            result = {
              action: "PROPOSAL_REQUIRES_CONFIRMATION",
              product_id: product.id,
              title: product.title,
              quantity: qty,
              price_egp: product.price_cents / 100,
            };
          }
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${toolCall.name}` }, { status: 400 });
    }

    return NextResponse.json({
      system_prompt: SHOPPING_ASSISTANT_PROMPT,
      tools: AI_TOOLS_SCHEMA,
      tool: toolCall.name,
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
