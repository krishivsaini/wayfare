// API client — see spec §10.2. credentials: "include" is critical for cookie auth.
import type { Trip, CreateTripInput, User, BudgetCheck } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
  return json.data as T;
}

export const api = {
  signup: (body: { email: string; password: string }) =>
    request<User>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),
  listTrips: () => request<Trip[]>("/trips"),
  getTrip: (id: string) => request<Trip>(`/trips/${id}`),
  createTrip: (input: CreateTripInput) =>
    request<Trip>("/trips", { method: "POST", body: JSON.stringify(input) }),
  deleteTrip: (id: string) => request<void>(`/trips/${id}`, { method: "DELETE" }),
  regenerateDay: (tripId: string, dayNumber: number, userInstruction?: string) =>
    request<{ trip: Trip; budgetCheck: BudgetCheck }>(
      `/trips/${tripId}/days/${dayNumber}/regenerate`,
      { method: "POST", body: JSON.stringify({ userInstruction }) }
    ),
  deleteActivity: (tripId: string, dayNumber: number, activityId: string) =>
    request<Trip>(
      `/trips/${tripId}/days/${dayNumber}/activities/${activityId}`,
      { method: "DELETE" }
    ),
  // PDF is a binary stream, not JSON — bypass `request` and download the blob.
  // fetch + blob (not <a href>) so the auth cookie is sent cross-origin.
  exportTripPdf: async (tripId: string): Promise<void> => {
    const res = await fetch(`${BASE}/trips/${tripId}/export`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to export PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    const filename = match?.[1] || "wayfare-itinerary.pdf";
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
