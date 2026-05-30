import { nanoid } from "nanoid";
import { genai } from "./gemini.js";
import { RegenerateDayLLMResponseSchema, type Activity, type Budget } from "../shared/schemas.js";
import { toGeminiJsonSchema } from "./jsonSchema.js";
import { regenerateDayPrompt } from "./prompts.js";
import { withRetry } from "./withRetry.js";
import { env } from "../config/env.js";
import type { IDay } from "../models/Trip.js";

const responseJsonSchema = toGeminiJsonSchema(RegenerateDayLLMResponseSchema);

export async function regenerateDay(args: {
  destination: string;
  budgetTier: "low" | "medium" | "high";
  interests: string[];
  numDays: number;
  dayNumber: number;
  currentDays: IDay[];
  budget: Budget;
  userInstruction?: string;
}) {
  return withRetry(async () => {
    const spentOnOtherDays = args.currentDays
      .filter(d => d.dayNumber !== args.dayNumber)
      .reduce((sum, d) => sum + d.activities.reduce((s, a) => s + a.estCostUsd, 0), 0);

    const remainingActivitiesBudgetUsd = Math.max(
      args.budget.activities - spentOnOtherDays,
      args.budget.activities / args.numDays
    );

    const otherDaysContext = args.currentDays
      .filter(d => d.dayNumber !== args.dayNumber)
      .map(d => ({
        dayNumber: d.dayNumber,
        activityTitles: d.activities.map(a => a.title),
      }));

    const prompt = regenerateDayPrompt({
      destination: args.destination,
      budgetTier: args.budgetTier,
      interests: args.interests,
      dayNumber: args.dayNumber,
      remainingActivitiesBudgetUsd,
      otherDaysContext,
      userInstruction: args.userInstruction,
    });

    const response = await genai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema,
        temperature: 0.8,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(raw);
    const validated = RegenerateDayLLMResponseSchema.parse(parsed);

    const totalCost = validated.activities.reduce((s, a) => s + a.estCostUsd, 0);
    if (totalCost > remainingActivitiesBudgetUsd * 1.1) {
      console.warn(
        `Day ${args.dayNumber} regen exceeded budget: $${totalCost.toFixed(2)} > $${remainingActivitiesBudgetUsd.toFixed(2)}`
      );
    }

    const activitiesWithIds: Activity[] = validated.activities.map(a => ({
      ...a,
      id: nanoid(10),
    }));

    return {
      dayNumber: args.dayNumber,
      activities: activitiesWithIds,
      budgetCheck: {
        remainingBudgetUsd: remainingActivitiesBudgetUsd,
        regeneratedCostUsd: totalCost,
        withinBudget: totalCost <= remainingActivitiesBudgetUsd,
      },
    };
  });
}
