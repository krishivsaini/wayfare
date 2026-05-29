import { z } from "zod";
import { genai } from "./gemini";
import { HotelSchema } from "../shared/schemas";
import { toGeminiJsonSchema } from "./jsonSchema";
import { suggestHotelsPrompt } from "./prompts";
import { withRetry } from "./withRetry";
import { env } from "../config/env";

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
