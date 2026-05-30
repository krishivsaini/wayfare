// Display helpers — formatting + light trip math used across pages.
import type { Day, Trip } from "./types";

export function dayCost(day: Day): number {
  return day.activities.reduce((s, a) => s + a.estCostUsd, 0);
}

export function tripActivitiesSpent(trip: Trip): number {
  return trip.itinerary.days.reduce((s, d) => s + dayCost(d), 0);
}

export function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
}

export function dayDate(trip: Trip, dayNumber: number): Date | null {
  if (!trip.startDate) return null;
  const d = new Date(trip.startDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
}

export const TIER_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
export const HOTEL_TIER_LABEL: Record<string, string> = { budget: "Budget", mid: "Mid", luxury: "Luxury" };
