import { nanoid } from "nanoid";
import { genai } from "./gemini.js";
import { GenerateTripLLMResponseSchema, CreateTripInput } from "../shared/schemas.js";
import { toGeminiJsonSchema } from "./jsonSchema.js";
import { generateTripPrompt } from "./prompts.js";
import { withRetry } from "./withRetry.js";
import { env } from "../config/env.js";

const responseJsonSchema = toGeminiJsonSchema(GenerateTripLLMResponseSchema);

export async function generateTrip(input: CreateTripInput) {
  return withRetry(async () => {
    const prompt = generateTripPrompt(input);

    const response = await genai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema,
        temperature: 0.7,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from Gemini");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse Gemini JSON: ${(err as Error).message}`);
    }

    const validated = GenerateTripLLMResponseSchema.parse(parsed);

    const days = validated.days.map(d => ({
      ...d,
      activities: d.activities.map(a => ({ ...a, id: nanoid(10) })),
    }));

    return {
      days,
      budget: validated.budget,
      hotels: validated.hotels,
    };
  });
}
