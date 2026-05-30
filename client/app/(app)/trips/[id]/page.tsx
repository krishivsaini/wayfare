"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { Spinner } from "@/components/ui";
import { TripDetail } from "@/components/trip-detail";
import { RegenerateDayDialog } from "@/components/regen-dialog";

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [err, setErr] = useState("");
  const [regenDay, setRegenDay] = useState<number | null>(null);

  useEffect(() => {
    api
      .getTrip(id)
      .then(setTrip)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load trip."));
  }, [id]);

  async function handleDeleteActivity(dayNumber: number, activityId: string) {
    if (!trip) return;
    const prev = trip;
    setTrip({
      ...trip,
      itinerary: {
        days: trip.itinerary.days.map((d) =>
          d.dayNumber === dayNumber ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) } : d
        ),
      },
    });
    try {
      const updated = await api.deleteActivity(id, dayNumber, activityId);
      setTrip(updated);
    } catch (e) {
      setTrip(prev);
      setErr(e instanceof Error ? e.message : "Failed to remove activity.");
    }
  }

  function handleRegen(dayNumber: number) {
    setRegenDay(dayNumber);
  }

  if (err && !trip) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 28px", textAlign: "center" }}>
        <p style={{ color: "var(--accent-ink)", marginBottom: 16 }}>{err}</p>
        <Link href="/dashboard" className="label" style={{ color: "var(--accent)" }}>
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Spinner size={20} color="var(--ink-3)" />
      </div>
    );
  }

  return (
    <>
      <TripDetail
        trip={trip}
        onBack={() => router.push("/dashboard")}
        onRegen={handleRegen}
        onDeleteActivity={handleDeleteActivity}
      />
      {regenDay !== null && (
        <RegenerateDayDialog
          trip={trip}
          dayNumber={regenDay}
          onClose={() => setRegenDay(null)}
          onTripUpdate={setTrip}
        />
      )}
      {err && trip && (
        <div
          className="fade"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 14px",
            background: "var(--accent-wash)",
            border: "1px solid #F0C6B6",
            borderRadius: "var(--r)",
            fontSize: 13,
            color: "var(--accent-ink)",
            boxShadow: "var(--shadow-2)",
          }}
          onClick={() => setErr("")}
        >
          {err}
        </div>
      )}
    </>
  );
}
