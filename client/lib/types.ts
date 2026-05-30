// Client-side TS types. Mirror the server's shared/schemas.ts shape.

export type BudgetTier = "low" | "medium" | "high";
export type TimeOfDay = "morning" | "afternoon" | "evening";
export type HotelTier = "budget" | "mid" | "luxury";

export interface Activity {
  id: string;
  title: string;
  description: string;
  timeOfDay: TimeOfDay;
  estCostUsd: number;
  reasoning: string;
  confidence: number;
}

export interface Day {
  dayNumber: number;
  activities: Activity[];
}

export interface Budget {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
  currency: "USD";
}

export interface Hotel {
  name: string;
  tier: HotelTier;
  reasoning: string;
}

export interface Trip {
  id: string;
  destination: string;
  numDays: number;
  budgetTier: BudgetTier;
  interests: string[];
  itinerary: { days: Day[] };
  budget: Budget;
  hotels: Hotel[];
  version: number;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  destination: string;
  numDays: number;
  budgetTier: BudgetTier;
  interests: string[];
}

export interface User {
  id: string;
  email: string;
}

export interface BudgetCheck {
  remaining: number;
  usedByDay: number;
  ok: boolean;
}
