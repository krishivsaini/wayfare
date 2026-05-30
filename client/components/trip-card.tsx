"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import type { Trip } from "@/lib/types";
import { TIER_LABEL, fmtUsd } from "@/lib/format";
import { Button, tierGlyph } from "./ui";

export function TripCard({ trip, idx, onDelete }: { trip: Trip; idx: number; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="rise wf-card"
      style={{
        animationDelay: idx * 0.05 + "s",
        cursor: "pointer",
        position: "relative",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: 20,
        boxShadow: "var(--shadow-1)",
        transition: "border-color .16s, box-shadow .16s, transform .16s",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 196,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 19, marginBottom: 6 }}>{trip.destination}</h3>
          <div className="label" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="num">{String(trip.numDays).padStart(2, "0")} DAYS</span>
            <span style={{ color: "var(--line-strong)" }}>/</span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {tierGlyph(trip.budgetTier)} {TIER_LABEL[trip.budgetTier].toUpperCase()}
            </span>
          </div>
        </div>
        <span
          className="label num"
          style={{ background: "var(--paper-2)", padding: "3px 8px", borderRadius: 99, color: "var(--ink-3)" }}
        >
          v{trip.version}
        </span>
      </div>

      <DayDots n={trip.numDays} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
        {trip.interests.slice(0, 3).map((it) => (
          <span
            key={it}
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              background: "var(--paper-2)",
              border: "1px solid var(--line)",
              padding: "3px 9px",
              borderRadius: 99,
            }}
          >
            {it}
          </span>
        ))}
        {trip.interests.length > 3 && (
          <span style={{ fontSize: 12, color: "var(--ink-3)", padding: "3px 4px" }}>
            +{trip.interests.length - 3}
          </span>
        )}
      </div>

      <div className="hr" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="label" style={{ color: "var(--ink-3)" }}>
          Est. total
        </span>
        <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>
          {fmtUsd(trip.budget.total)}
        </span>
      </div>

      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ position: "absolute", top: 16, right: 54 }}
      >
        {confirm ? (
          <span className="fade" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={onDelete}
              className="label"
              style={{
                background: "#F6E9E4",
                color: "#8E2A10",
                border: "1px solid #F0C6B6",
                borderRadius: 6,
                padding: "3px 7px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="label"
              style={{ background: "none", border: 0, color: "var(--ink-3)", cursor: "pointer" }}
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            title="Delete trip"
            style={{
              background: "none",
              border: 0,
              color: "var(--ink-4)",
              fontSize: 16,
              lineHeight: 1,
              padding: 4,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </div>
    </Link>
  );
}

export function DayDots({ n }: { n: number }) {
  const shown = Math.min(n, 7);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, height: 16 }}>
      {Array.from({ length: shown }).map((_, i) => (
        <Fragment key={i}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: i === 0 ? "var(--accent)" : "var(--ink-4)",
              flex: "0 0 auto",
            }}
          />
          {i < shown - 1 && <span style={{ flex: 1, height: 1, background: "var(--line-2)" }} />}
        </Fragment>
      ))}
      {n > 7 && (
        <span className="label num" style={{ marginLeft: 8, color: "var(--ink-3)" }}>
          +{n - 7}
        </span>
      )}
    </div>
  );
}

export function EmptyTrips() {
  return (
    <div
      className="rise"
      style={{
        border: "1px dashed var(--line-strong)",
        borderRadius: "var(--r-xl)",
        background: "var(--card)",
        padding: "64px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 6 }}>
        <circle cx="28" cy="28" r="22" stroke="var(--line-strong)" strokeWidth="1.5" />
        <path d="M28 13 L34 28 L28 43 L22 28 Z" fill="var(--accent)" opacity=".9" />
        <circle cx="28" cy="28" r="3" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
      </svg>
      <h2 style={{ fontSize: 21 }}>No trips yet — let&apos;s plan one</h2>
      <p style={{ color: "var(--ink-2)", maxWidth: 380, margin: "2px 0 18px" }}>
        Tell the agent where you&apos;re going and what you&apos;re into. You&apos;ll get a paced, day-by-day itinerary
        you can edit and regenerate.
      </p>
      <Link href="/trips/new" style={{ textDecoration: "none" }}>
        <Button kind="primary" size="lg">
          Plan a trip
        </Button>
      </Link>
    </div>
  );
}
