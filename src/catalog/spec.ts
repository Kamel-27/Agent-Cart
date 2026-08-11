/**
 * A tiny spec DSL for product attributes.
 *
 * One declaration per attribute is the single source of truth for three things
 * that would otherwise drift apart:
 *
 *   toZod()        runtime validation of extracted values
 *   toJsonSchema() the schema handed to the model for structured output
 *   toPromptDoc()  the human-readable field list shown in the prompt
 *
 * Every attribute is nullable by design. `null` means "we do not know", which
 * is a different fact from "the product does not have this" — comparison tables
 * need to render those differently, so we never conflate them with `undefined`
 * or an empty string.
 */

import { z } from "zod";

export type AttrSpec =
  | { kind: "number"; desc: string; unit?: string; min?: number; max?: number; integer?: boolean; better?: "higher" | "lower" | "none" }
  | { kind: "enum"; desc: string; values: readonly string[]; better?: "higher" | "lower" | "none" }
  | { kind: "boolean"; desc: string; better?: "higher" | "lower" | "none" }
  | { kind: "string"; desc: string; maxLength?: number; better?: "higher" | "lower" | "none" };

export type AttrSpecMap = Record<string, AttrSpec>;

/** Build a zod object that validates an `attrs` payload for one category. */
export function toZod(specs: AttrSpecMap): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const [key, spec] of Object.entries(specs)) {
    let base: z.ZodTypeAny;

    switch (spec.kind) {
      case "number": {
        let n = z.number();
        if (spec.integer) n = n.int();
        if (spec.min !== undefined) n = n.min(spec.min);
        if (spec.max !== undefined) n = n.max(spec.max);
        base = n;
        break;
      }
      case "enum":
        base = z.enum(spec.values as [string, ...string[]]);
        break;
      case "boolean":
        base = z.boolean();
        break;
      case "string": {
        let s = z.string().min(1);
        if (spec.maxLength !== undefined) s = s.max(spec.maxLength);
        base = s;
        break;
      }
    }

    // Accept a missing key on input, but always normalize it to explicit null.
    shape[key] = base.nullable().optional().transform((v) => (v === undefined ? null : v));
  }

  return z.object(shape).strict();
}

type JsonSchemaNode = Record<string, unknown>;

/**
 * JSON Schema for the model's structured output.
 *
 * Anthropic's strict mode requires every property to appear in `required` and
 * `additionalProperties: false`, so nullability is expressed as a union type
 * (`["number", "null"]`) rather than by omitting the key.
 */
export function toJsonSchema(specs: AttrSpecMap): JsonSchemaNode {
  const properties: Record<string, JsonSchemaNode> = {};

  for (const [key, spec] of Object.entries(specs)) {
    switch (spec.kind) {
      case "number":
        properties[key] = {
          type: [spec.integer ? "integer" : "number", "null"],
          description: spec.unit ? `${spec.desc} (unit: ${spec.unit})` : spec.desc,
        };
        break;
      case "enum":
        properties[key] = {
          type: ["string", "null"],
          enum: [...spec.values, null],
          description: spec.desc,
        };
        break;
      case "boolean":
        properties[key] = { type: ["boolean", "null"], description: spec.desc };
        break;
      case "string":
        properties[key] = { type: ["string", "null"], description: spec.desc };
        break;
    }
  }

  return {
    type: "object",
    properties,
    required: Object.keys(specs),
    additionalProperties: false,
  };
}

/** Readable field list for the prompt body. Providers without native schema
 *  support rely on this, and it also improves accuracy for those that do. */
export function toPromptDoc(specs: AttrSpecMap): string {
  return Object.entries(specs)
    .map(([key, spec]) => {
      let type: string;
      switch (spec.kind) {
        case "number":
          type = spec.integer ? "integer" : "number";
          if (spec.unit) type += ` in ${spec.unit}`;
          break;
        case "enum":
          type = `one of ${spec.values.map((v) => `"${v}"`).join(" | ")}`;
          break;
        case "boolean":
          type = "true or false";
          break;
        case "string":
          type = "short string";
          break;
      }
      return `- ${key}: ${type} — ${spec.desc}`;
    })
    .join("\n");
}
