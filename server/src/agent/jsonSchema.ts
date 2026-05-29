import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

/**
 * Converts a Zod schema to a Gemini-compatible JSON Schema.
 * Strips $schema and additionalProperties, which Gemini's
 * responseJsonSchema rejects.
 */
export function toGeminiJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = zodToJsonSchema(schema as any, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  const strip = (obj: unknown): void => {
    if (Array.isArray(obj)) {
      obj.forEach(strip);
      return;
    }
    if (obj && typeof obj === "object") {
      const o = obj as Record<string, unknown>;
      delete o.$schema;
      delete o.additionalProperties;
      Object.values(o).forEach(strip);
    }
  };
  strip(json);
  return json;
}
