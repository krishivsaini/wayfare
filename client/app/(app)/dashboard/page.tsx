"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { Button, Spinner } from "@/components/ui";
import { EmptyTrips, TripCard } from "@/components/trip-card";

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .listTrips()
      .then(setTrips)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load trips."));
  }, []);

  async function handleDelete(id: string) {
    const prev = trips;
    setTrips((t) => (t ? t.filter((x) => x.id !== id) : t));
    try {
      await api.deleteTrip(id);
    } catch (e) {
      setTrips(prev);
      setErr(e instanceof Error ? e.message : "Failed to delete trip.");
    }
  }

  if (!trips && !err) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Spinner size={20} color="var(--ink-3)" />
      </div>
    );
  }

  if (!trips) {
    return (
      <div className="wf-dash" style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 28px 80px" }}>
        <div
          className="fade"
          style={{
            padding: "10px 12px",
            background: "var(--accent-wash)",
            border: "1px solid #F0C6B6",
            borderRadius: "var(--r)",
            fontSize: 13,
            color: "var(--accent-ink)",
          }}
        >
          {err}
        </div>
      </div>
    );
  }

  const empty = trips.length === 0;

  return (
    <div className="wf-dash" style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 28px 80px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 30,
        }}
      >
        <div className="rise">
          <div className="label" style={{ color: "var(--accent)", marginBottom: 10 }}>
            Your trips
          </div>
          <h1 style={{ fontSize: 28 }}>
            {empty
              ? "Nothing planned yet"
              : `${trips.length} ${trips.length === 1 ? "itinerary" : "itineraries"}`}
          </h1>
        </div>
        {!empty && (
          <Link href="/trips/new" style={{ textDecoration: "none" }}>
            <Button kind="primary">+ New trip</Button>
          </Link>
        )}
      </div>

      {err && (
        <div
          className="fade"
          style={{
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--accent-wash)",
            border: "1px solid #F0C6B6",
            borderRadius: "var(--r)",
            fontSize: 13,
            color: "var(--accent-ink)",
          }}
        >
          {err}
        </div>
      )}

      {empty ? (
        <EmptyTrips />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(330px, 100%), 1fr))", gap: 18 }}>
          {trips.map((t, i) => (
            <TripCard key={t.id} trip={t} idx={i} onDelete={() => handleDelete(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
