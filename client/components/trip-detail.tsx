"use client";
import { useState } from "react";
import type { Activity, Day, Hotel, Trip } from "@/lib/types";
import { api } from "@/lib/api";
import { HOTEL_TIER_LABEL, TIER_LABEL, dayCost, dayDate, fmtDate, fmtUsd, tripActivitiesSpent } from "@/lib/format";
import { Button, ConfidenceMeter, Spinner, TodGlyph, confTone, tierGlyph } from "./ui";

export function TripDetail({
  trip,
  onBack,
  onRegen,
  onDeleteActivity,
  onError,
}: {
  trip: Trip;
  onBack: () => void;
  onRegen: (dayNumber: number) => void;
  onDeleteActivity: (dayNumber: number, activityId: string) => void;
  onError?: (msg: string) => void;
}) {
  const spent = tripActivitiesSpent(trip);
  return (
    <div className="wf-detail" style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 90px" }}>
      <button
        onClick={onBack}
        className="label"
        style={{
          background: "none",
          border: 0,
          color: "var(--ink-3)",
          marginBottom: 20,
          letterSpacing: ".12em",
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← Trips
      </button>
      <TripHeader trip={trip} onError={onError} />

      <div
        className="wf-trip-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 330px",
          gap: 30,
          alignItems: "start",
          marginTop: 30,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {trip.itinerary.days.map((day, i) => (
            <DayCard
              key={day.dayNumber}
              trip={trip}
              day={day}
              idx={i}
              onRegen={() => onRegen(day.dayNumber)}
              onDeleteActivity={(aid) => onDeleteActivity(day.dayNumber, aid)}
            />
          ))}
        </div>

        <div
          className="wf-side"
          style={{ position: "sticky", top: 78, display: "flex", flexDirection: "column", gap: "var(--gap)" }}
        >
          <BudgetCard trip={trip} spent={spent} />
          <HotelsCard hotels={trip.hotels} />
        </div>
      </div>
    </div>
  );
}

function ExportButton({ trip, onError }: { trip: Trip; onError?: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      await api.exportTripPdf(trip.id);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Failed to export PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      kind="default"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      title="Download a PDF of this itinerary"
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
      }}
    >
      {loading ? <Spinner size={13} color="var(--ink-3)" /> : <PdfIcon />}
      {loading ? "Exporting…" : "Export PDF"}
    </Button>
  );
}

function TripHeader({ trip, onError }: { trip: Trip; onError?: (msg: string) => void }) {
  const lastDate = dayDate(trip, trip.numDays);
  return (
    <div className="rise">
      <div
        className="label"
        style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}
      >
        <span style={{ color: "var(--accent)" }}>Itinerary</span>
        <span style={{ color: "var(--line-strong)" }}>/</span>
        {trip.startDate && lastDate ? (
          <>
            <span className="num">
              {fmtDate(trip.startDate, { month: "short", day: "numeric" })} –{" "}
              {fmtDate(lastDate.toISOString(), { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span style={{ color: "var(--line-strong)" }}>/</span>
          </>
        ) : null}
        <span className="num">v{trip.version}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <h1 className="wf-detail-title" style={{ fontSize: 36, letterSpacing: "-.03em" }}>{trip.destination}</h1>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="label" style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
            {tierGlyph(trip.budgetTier)} {TIER_LABEL[trip.budgetTier]} budget
          </span>
          <ExportButton trip={trip} onError={onError} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
        {trip.interests.map((it) => (
          <span
            key={it}
            style={{
              fontSize: 12.5,
              color: "var(--ink-2)",
              background: "var(--card)",
              border: "1px solid var(--line)",
              padding: "4px 10px",
              borderRadius: 99,
            }}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function DayCard({
  trip,
  day,
  idx,
  onRegen,
  onDeleteActivity,
}: {
  trip: Trip;
  day: Day;
  idx: number;
  onRegen: () => void;
  onDeleteActivity: (activityId: string) => void;
}) {
  const cost = dayCost(day);
  const date = dayDate(trip, day.dayNumber);
  return (
    <section
      className="rise"
      style={{
        animationDelay: idx * 0.05 + "s",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          rowGap: 8,
          flexWrap: "wrap",
          padding: "16px var(--card-pad)",
          borderBottom: "1px solid var(--line)",
          background: "var(--card-raised)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span className="label num" style={{ fontSize: 12, color: "var(--accent)" }}>
            DAY {String(day.dayNumber).padStart(2, "0")}
          </span>
          {date && (
            <>
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <span className="num" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                {fmtDate(date.toISOString(), { month: "short", day: "numeric" })}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num" style={{ fontSize: 13, color: "var(--ink-2)" }}>
            {fmtUsd(cost)}
          </span>
          <Button kind="ghost" size="sm" onClick={onRegen} title="Regenerate this day">
            <RegenIcon /> Regenerate
          </Button>
        </div>
      </div>

      <div style={{ padding: "6px var(--card-pad) var(--card-pad)" }}>
        {day.activities.length === 0 ? (
          <div style={{ padding: "24px 4px", color: "var(--ink-3)", fontSize: 14 }}>
            No activities on this day yet.{" "}
            <button
              onClick={onRegen}
              style={{ background: "none", border: 0, color: "var(--accent)", fontWeight: 500, cursor: "pointer" }}
            >
              Generate some →
            </button>
          </div>
        ) : (
          day.activities.map((a, i) => (
            <ActivityRow
              key={a.id}
              a={a}
              last={i === day.activities.length - 1}
              onDelete={() => onDeleteActivity(a.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ActivityRow({ a, last, onDelete }: { a: Activity; last: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const tone = confTone(a.confidence);

  return (
    <div style={{ display: "flex", gap: 14, paddingTop: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 18px" }}>
        <div style={{ marginTop: 2 }}>
          <TodGlyph tod={a.timeOfDay} />
        </div>
        {!last && <div style={{ flex: 1, width: 1.5, background: "var(--line-2)", marginTop: 6, minHeight: 12 }} />}
      </div>

      <div
        style={{
          flex: 1,
          paddingBottom: last ? 2 : 14,
          borderBottom: last ? "none" : "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: 5 }}>
              {a.timeOfDay}
            </div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>{a.title}</h4>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, maxWidth: "56ch", lineHeight: 1.5 }}>
              {a.description}
            </p>
          </div>
          <div style={{ textAlign: "right", flex: "0 0 auto" }}>
            <div className="num" style={{ fontSize: 14, fontWeight: 600 }}>
              {a.estCostUsd === 0 ? "Free" : fmtUsd(a.estCostUsd)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          <ConfidenceMeter c={a.confidence} mode="glyph" />
          <button
            onClick={() => setOpen((o) => !o)}
            className="label"
            style={{
              background: "none",
              border: 0,
              color: open ? "var(--ink)" : "var(--ink-3)",
              letterSpacing: ".1em",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }}>
              ›
            </span>
            {open ? "Hide reasoning" : "Why this?"}
          </button>
          <div style={{ flex: 1 }} />
          {confirm ? (
            <span className="fade" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={onDelete}
                className="label"
                style={{
                  background: "#F6E9E4",
                  color: "#8E2A10",
                  border: "1px solid #F0C6B6",
                  borderRadius: 6,
                  padding: "3px 8px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="label"
                style={{ background: "none", border: 0, color: "var(--ink-3)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="label"
              style={{ background: "none", border: 0, color: "var(--ink-4)", letterSpacing: ".1em", cursor: "pointer" }}
            >
              Remove
            </button>
          )}
        </div>

        {open && (
          <div
            className="fade"
            style={{
              marginTop: 10,
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              borderLeft: "2px solid " + tone.color,
              background: tone.wash,
              padding: "9px 12px",
              borderRadius: "0 var(--r-sm) var(--r-sm) 0",
            }}
          >
            <span className="label" style={{ color: tone.color, marginTop: 1, flex: "0 0 auto" }}>
              Why
            </span>
            <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>{a.reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetCard({ trip, spent }: { trip: Trip; spent: number }) {
  const b = trip.budget;
  const segs = [
    { k: "Flights", v: b.flights, c: "var(--ink)" },
    { k: "Stay", v: b.accommodation, c: "#6B6A5E" },
    { k: "Food", v: b.food, c: "#A39A82" },
    { k: "Activities", v: b.activities, c: "var(--accent)" },
  ];
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: "var(--card-pad)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span className="label">Budget estimate</span>
        <span className="num" style={{ fontSize: 19, fontWeight: 600 }}>
          {fmtUsd(b.total)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 16,
          background: "var(--paper-2)",
        }}
      >
        {segs.map((s) => (
          <div
            key={s.k}
            title={`${s.k}: ${fmtUsd(s.v)}`}
            style={{ width: (s.v / b.total) * 100 + "%", background: s.c }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {segs.map((s) => (
          <div
            key={s.k}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: s.c }} />
              {s.k}
            </span>
            <span className="num" style={{ color: "var(--ink-2)" }}>
              {fmtUsd(s.v)}
            </span>
          </div>
        ))}
      </div>
      <div className="hr" style={{ margin: "14px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}>
        <span>Activities planned</span>
        <span className="num">
          {fmtUsd(spent)} / {fmtUsd(b.activities)}
        </span>
      </div>
    </div>
  );
}

function HotelsCard({ hotels }: { hotels: Hotel[] }) {
  if (!hotels || hotels.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: "var(--card-pad)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span className="label">Where to stay</span>
        <span className="label" style={{ color: "var(--ink-4)", letterSpacing: ".08em" }}>
          Agent-suggested
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {hotels.map((h, i) => (
          <div
            key={i}
            style={{
              paddingBottom: i < hotels.length - 1 ? 14 : 0,
              borderBottom: i < hotels.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 0 }}>{h.name}</span>
              <span
                className="label"
                style={{
                  display: "inline-flex",
                  gap: 6,
                  alignItems: "center",
                  color: "var(--ink-3)",
                  flex: "0 0 auto",
                  marginTop: 2,
                }}
              >
                {tierGlyph(h.tier)} {HOTEL_TIER_LABEL[h.tier]}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>{h.reasoning}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "14px 0 0", lineHeight: 1.5 }}>
        Suggestions only — not bookable in Wayfare.
      </p>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9 1.5H4.5A1.5 1.5 0 003 3v10a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 13V5.5L9 1.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 1.5V5.5H13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function RegenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 2v3h-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
