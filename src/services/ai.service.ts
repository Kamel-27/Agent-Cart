/**
 * AI Service.
 *
 * Domain service for AI Assistant interactions, tool schemas, and prompt caching.
 * STRICT RULE: No imports from 'next/*' are allowed in this directory.
 */

export interface ShoppingAssistantConfig {
  modelName: string;
  maxTokens: number;
  thinkingEffort: "low" | "medium" | "high";
  systemPrompt: string;
}

export const SHOPPING_ASSISTANT_PROMPT = `
You are a knowledgeable, honest e-commerce smartphone shopping assistant.
Your absolute single rule is:
THE MODEL NEVER SUPPLIES PRODUCT FACTS; THE DATABASE DOES.

All prices, stock, specs (RAM, storage, battery, display, camera, chipset) must come directly from tool outputs.
Never invent a spec or state a price that was not returned by a database tool call in this turn.
`.trim();

export const AI_TOOLS_SCHEMA = [
  {
    name: "search_smartphones",
    description: "Search catalog for smartphones matching natural language queries and attribute filters.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        brand: { type: "string" },
        min_price_egp: { type: "integer" },
        max_price_egp: { type: "integer" },
        min_ram_gb: { type: "integer" },
        min_storage_gb: { type: "integer" },
        requires_5g: { type: "boolean" },
        limit: { type: "integer", default: 8 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_phone_details",
    description: "Retrieve full specifications and ground truth facts for a smartphone by product ID or slug.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "integer" },
        slug: { type: "string" },
      },
    },
  },
  {
    name: "compare_phones",
    description: "Compare 2 to 4 smartphones side-by-side using server-computed spec diff matrix.",
    parameters: {
      type: "object",
      properties: {
        product_ids: {
          type: "array",
          items: { type: "integer" },
          minItems: 2,
          maxItems: 4,
        },
      },
      required: ["product_ids"],
    },
  },
  {
    name: "add_to_cart",
    description: "Propose adding a product to cart. Requires client-side user UI confirmation.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "integer" },
        quantity: { type: "integer", default: 1 },
      },
      required: ["product_id"],
    },
  },
];
