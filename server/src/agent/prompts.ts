import { CreateTripInput } from "../shared/schemas.js";

export function generateTripPrompt(input: CreateTripInput): string {
  return `You are a travel-planning agent. Generate a detailed ${input.numDays}-day itinerary for ${input.destination}.

User preferences:
- Budget tier: ${input.budgetTier}
- Interests: ${input.interests.join(", ")}

Output rules:
1. Return ONLY valid JSON matching the provided schema.
2. Each day must have 3 to 5 activities, distributed across morning/afternoon/evening.
3. Every activity must include:
   - title (concise, specific - "Visit Senso-ji Temple" not "Visit a temple")
   - description (1-2 sentences)
   - timeOfDay
   - estCostUsd (realistic for budget tier)
   - reasoning (1 sentence: why THIS activity fits the user's interests and budget)
   - confidence (0.0-1.0: how confident you are this is a good recommendation)
4. Vary the activities across days. Don't repeat the same kind of attraction.
5. Pace each day realistically - don't pack 5 museums in one day.
6. The total activities budget across all days should match the activities figure in budget.
7. Budget guidance for ${input.budgetTier} tier in ${input.destination} for ${input.numDays} days:
   - Realistic flight estimate (round-trip economy from a major hub)
   - Accommodation: per-night × ${input.numDays} × tier-appropriate
   - Food: per-day × ${input.numDays} × tier-appropriate
   - Activities: sum of estCostUsd across all activities
   - Total: sum of the four above
8. Suggest 3 hotels, one per tier (budget/mid/luxury), each with a 1-sentence reasoning.

Confidence calibration:
- 0.9+: Iconic, must-do experiences for this destination
- 0.7-0.9: Strong fits for the user's stated interests
- 0.5-0.7: Reasonable but more generic recommendations
- Below 0.5: Don't include - pick something better

Return ONLY the JSON. No markdown, no preamble.`;
}

export function regenerateDayPrompt(args: {
  destination: string;
  budgetTier: string;
  interests: string[];
  dayNumber: number;
  remainingActivitiesBudgetUsd: number;
  otherDaysContext: { dayNumber: number; activityTitles: string[] }[];
  userInstruction?: string;
}): string {
  const { destination, budgetTier, interests, dayNumber, remainingActivitiesBudgetUsd, otherDaysContext, userInstruction } = args;

  const otherDaysSummary = otherDaysContext
    .map(d => `Day ${d.dayNumber}: ${d.activityTitles.join(", ")}`)
    .join("\n");

  return `You are regenerating ONLY Day ${dayNumber} of an existing ${destination} itinerary.

EXISTING TRIP CONTEXT:
- Destination: ${destination}
- Budget tier: ${budgetTier}
- User interests: ${interests.join(", ")}
- Other days already planned:
${otherDaysSummary}

CONSTRAINTS:
- Generate 3-5 activities for Day ${dayNumber} only.
- Total estCostUsd across these activities MUST NOT exceed ${remainingActivitiesBudgetUsd.toFixed(2)} USD.
- Avoid duplicating attractions/categories already covered on other days.
- Maintain realistic pacing (no 4 museums in one day).
- Cover under-represented interests if possible.

USER INSTRUCTION: ${userInstruction || "(no specific instruction - regenerate with variety)"}

OUTPUT:
Return ONLY valid JSON with this shape:
{
  "dayNumber": ${dayNumber},
  "activities": [ { title, description, timeOfDay, estCostUsd, reasoning, confidence } ]
}

Every activity must include reasoning (1 sentence) and confidence (0.0-1.0).
Return ONLY the JSON. No markdown, no preamble.`;
}

export function suggestHotelsPrompt(destination: string, budgetTier: string): string {
  return `Suggest 3 hotels for ${destination} matching a ${budgetTier} budget tier.

For each hotel:
- name (real hotel name where possible)
- tier (budget | mid | luxury)
- reasoning (1 sentence: why a traveler with ${budgetTier} budget would pick this)

Return JSON: { "hotels": [...] }. No markdown.`;
}
