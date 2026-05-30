"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { BudgetCheck, Trip } from "@/lib/types";
import { dayCost, fmtUsd } from "@/lib/format";
import { Button, Chip, ConfidenceGlyph, Field, Spinner, TodGlyph, inputStyle } from "./ui";

type Phase = "form" | "working" | "review";

const EXAMPLES = ["More food, less walking", "Cheaper day", "Focus on craft & design", "Slower pace"];

export function RegenerateDayDialog({
  trip,
  dayNumber,
  onClose,
  onTripUpdate,
}: {
  trip: Trip;
  dayNumber: number;
  onClose: () => void;
  onTripUpdate: (next: Trip) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [updated, setUpdated] = useState<Trip | null>(null);
  const [budgetCheck, setBudgetCheck] = useState<BudgetCheck | null>(null);
  const [err, setErr] = useState("");

  const spentOther = trip.itinerary.days
    .filter((d) => d.dayNumber !== dayNumber)
    .reduce((s, d) => s + dayCost(d), 0);
  const remaining = Math.max(
    trip.budget.activities - spentOther,
    trip.budget.activities / trip.numDays
  );
  const avoidTitles = trip.itinerary.days
    .filter((d) => d.dayNumber !== dayNumber)
    .flatMap((d) => d.activities.map((a) => a.title));

  async function run() {
    setPhase("working");
    setErr("");
    try {
      const res = await api.regenerateDay(trip.id, dayNumber, instruction.trim() || undefined);
      setUpdated(res.trip);
      setBudgetCheck(res.budgetCheck);
      onTripUpdate(res.trip);
      setPhase("review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Regeneration failed.");
      setPhase("form");
    }
  }

  const newDay = updated?.itinerary.days.find((d) => d.dayNumber === dayNumber);

  return (
    <div
      onClick={onClose}
      className="fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(27,26,22,.34)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="wf-pop"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--card-raised)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
          border: "1px solid var(--line)",
        }}
      >
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="label" style={{ color: "var(--accent)", marginBottom: 6 }}>
                Regenerate · Day {String(dayNumber).padStart(2, "0")}
              </div>
              <h2 style={{ fontSize: 20 }}>Replan this day</h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: 0,
                color: "var(--ink-3)",
                fontSize: 22,
                lineHeight: 1,
                padding: 2,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {phase === "form" && (
          <div style={{ padding: 22 }}>
            <div
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r)",
                padding: 14,
                marginBottom: 18,
              }}
            >
              <div className="label" style={{ marginBottom: 10 }}>
                Agent constraints
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13 }}>
                <Constraint label="Budget left for this day">
                  <span className="num" style={{ fontWeight: 600 }}>
                    {fmtUsd(remaining)}
                  </span>
                </Constraint>
                <Constraint label="Won't repeat">
                  <span style={{ color: "var(--ink-2)", textAlign: "right", maxWidth: 230, fontSize: 12 }}>
                    {avoidTitles.length === 0
                      ? "—"
                      : avoidTitles.slice(0, 4).join(" · ") + (avoidTitles.length > 4 ? " …" : "")}
                  </span>
                </Constraint>
                <Constraint label="Pacing">
                  <span style={{ color: "var(--ink-2)", fontSize: 12 }}>3–5 stops, no overload</span>
                </Constraint>
              </div>
            </div>

            <Field
              label="Instruction (optional)"
              hint="Tell the agent what to change. Leave blank to just shuffle for variety."
            >
              <textarea
                className="wf-input"
                style={{ ...inputStyle, resize: "vertical", minHeight: 72, lineHeight: 1.5 }}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. more food, less walking, keep it cheap"
                maxLength={300}
              />
            </Field>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
              {EXAMPLES.map((ex) => (
                <Chip key={ex} onClick={() => setInstruction(ex)}>
                  {ex}
                </Chip>
              ))}
            </div>

            {err && (
              <div
                className="fade"
                style={{
                  marginTop: 16,
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

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Button kind="primary" onClick={run} full>
                <RegenIcon /> Regenerate Day {dayNumber}
              </Button>
            </div>
          </div>
        )}

        {phase === "working" && (
          <div
            style={{
              padding: "40px 22px 44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 14,
            }}
          >
            <Spinner size={26} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Replanning Day {dayNumber}…</div>
              <p className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "6px 0 0" }}>
                Respecting {fmtUsd(remaining)} budget · avoiding {avoidTitles.length} prior stops
              </p>
            </div>
          </div>
        )}

        {phase === "review" && newDay && budgetCheck && (
          <div style={{ padding: 22 }}>
            <div
              className="label"
              style={{ marginBottom: 12, color: budgetCheck.ok ? "var(--good)" : "var(--warn)" }}
            >
              New plan · {fmtUsd(budgetCheck.usedByDay)} of {fmtUsd(budgetCheck.usedByDay + budgetCheck.remaining)}
              {!budgetCheck.ok && " · over budget"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {newDay.activities.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    gap: 11,
                    alignItems: "flex-start",
                    padding: "11px 12px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r)",
                  }}
                >
                  <div style={{ marginTop: 2 }}>
                    <TodGlyph tod={a.timeOfDay} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</span>
                      <span className="num" style={{ fontSize: 13 }}>
                        {a.estCostUsd === 0 ? "Free" : fmtUsd(a.estCostUsd)}
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ConfidenceGlyph c={a.confidence} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button kind="quiet" onClick={run}>
                ↻ Try again
              </Button>
              <Button kind="primary" full onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Constraint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      {children}
    </div>
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
