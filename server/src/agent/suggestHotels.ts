import { z } from "zod";
import { genai } from "./gemini.js";
import { HotelSchema } from "../shared/schemas.js";
import { toGeminiJsonSchema } from "./jsonSchema.js";
import { suggestHotelsPrompt } from "./prompts.js";
import { withRetry } from "./withRetry.js";
import { env } from "../config/env.js";

const SuggestHotelsResponseSchema = z.object({
  hotels: z.array(HotelSchema).min(2).max(5),
});

const responseJsonSchema = toGeminiJsonSchema(SuggestHotelsResponseSchema);

export async function suggestHotels(destination: string, budgetTier: "low" | "medium" | "high") {
  return withRetry(async () => {
    const response = await genai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: suggestHotelsPrompt(destination, budgetTier),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema,
        temperature: 0.5,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(raw);
    const validated = SuggestHotelsResponseSchema.parse(parsed);
    return validated.hotels;
  });
}
