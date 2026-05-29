import { z } from "zod";

export const BudgetTierSchema = z.enum(["low", "medium", "high"]);
export const TimeOfDaySchema = z.enum(["morning", "afternoon", "evening"]);
export const HotelTierSchema = z.enum(["budget", "mid", "luxury"]);

export const ActivitySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  timeOfDay: TimeOfDaySchema,
  estCostUsd: z.number().min(0).max(10000),
  reasoning: z.string().min(1).max(280),
  confidence: z.number().min(0).max(1),
});

export const DaySchema = z.object({
  dayNumber: z.number().int().min(1),
  activities: z.array(ActivitySchema).min(1).max(6),
});

export const BudgetSchema = z.object({
  flights: z.number().min(0),
  accommodation: z.number().min(0),
  food: z.number().min(0),
  activities: z.number().min(0),
  total: z.number().min(0),
  currency: z.literal("USD"),
});

export const HotelSchema = z.object({
  name: z.string().min(1),
  tier: HotelTierSchema,
  reasoning: z.string().min(1).max(280),
});

// LLM output for generateTrip - days come WITHOUT activity IDs;
// we add IDs server-side after parsing
export const ActivityFromLLMSchema = ActivitySchema.omit({ id: true });
export const DayFromLLMSchema = z.object({
  dayNumber: z.number().int().min(1),
  activities: z.array(ActivityFromLLMSchema).min(1).max(6),
});

export const GenerateTripLLMResponseSchema = z.object({
  days: z.array(DayFromLLMSchema).min(1),
  budget: BudgetSchema,
  hotels: z.array(HotelSchema).min(2).max(5),
});

export const RegenerateDayLLMResponseSchema = z.object({
  dayNumber: z.number().int().min(1),
  activities: z.array(ActivityFromLLMSchema).min(1).max(6),
});

// Route input schemas
export const SignupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const LoginInputSchema = SignupInputSchema;

export const CreateTripInputSchema = z.object({
  destination: z.string().min(2).max(100),
  numDays: z.number().int().min(1).max(14),
  budgetTier: BudgetTierSchema,
  interests: z.array(z.string()).min(1).max(8),
});

export const RegenerateDayInputSchema = z.object({
  userInstruction: z.string().max(300).optional(),
});

export const AddActivityInputSchema = z.object({
  dayNumber: z.number().int().min(1),
  activity: ActivityFromLLMSchema,
});

// Type exports
export type Activity = z.infer<typeof ActivitySchema>;
export type Day = z.infer<typeof DaySchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type Hotel = z.infer<typeof HotelSchema>;
export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;
