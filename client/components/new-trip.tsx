"use client";
import { useEffect, useState } from "react";
import type { BudgetTier, CreateTripInput } from "@/lib/types";
import { TIER_LABEL } from "@/lib/format";
import { Button, Chip, Field, Spinner, inputStyle, tierGlyph } from "./ui";

const INTEREST_SUGGESTIONS = [
  "temples & shrines", "food", "gardens", "craft & design", "walking", "architecture",
  "museums", "nightlife", "nature", "beaches", "history", "markets", "coffee", "hiking",
];

const BUDGET_TIERS: { key: BudgetTier; label: string; note: string }[] = [
  { key: "low", label: "Low", note: "Hostels & street food" },
  { key: "medium", label: "Medium", note: "3-star & casual dining" },
  { key: "high", label: "High", note: "Boutique & fine dining" },
];

export function NewTripForm({
  onGenerate,
  onCancel,
  seedError,
}: {
  onGenerate: (input: CreateTripInput) => void;
  onCancel: () => void;
  seedError?: string;
}) {
  const [destination, setDestination] = useState("");
  const [numDays, setNumDays] = useState(5);
  const [tier, setTier] = useState<BudgetTier>("medium");
  const [interests, setInterests] = useState<string[]>(["temples & shrines", "food"]);
  const [custom, setCustom] = useState("");
  const [err, setErr] = useState(seedError || "");

  function toggle(it: string) {
    setInterests((prev) =>
      prev.includes(it) ? prev.filter((x) => x !== it) : prev.length >= 8 ? prev : [...prev, it]
    );
  }

  function addCustom() {
    const v = custom.trim().toLowerCase();
    if (v && !interests.includes(v) && interests.length < 8) {
      setInterests([...interests, v]);
      setCustom("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (destination.trim().length < 2) {
      setErr("Where are you headed?");
      return;
    }
    if (interests.length < 1) {
      setErr("Pick at least one interest.");
      return;
    }
    onGenerate({ destination: destination.trim(), numDays, budgetTier: tier, interests });
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 28px 90px" }}>
      <button
        onClick={onCancel}
        className="label"
        style={{
          background: "none",
          border: 0,
          color: "var(--ink-3)",
          marginBottom: 22,
          letterSpacing: ".12em",
          cursor: "pointer",
        }}
      >
        ← Dashboard
      </button>
      <div className="rise">
        <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
          New trip
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Describe your trip</h1>
        <p style={{ color: "var(--ink-2)", margin: "0 0 30px" }}>
          The agent uses these as constraints — destination, length, budget tier, and what you&apos;re into.
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Field label="Destination">
            <input
              className="wf-input"
              style={{ ...inputStyle, fontSize: 17, padding: "13px 15px" }}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Kyoto, Japan"
              autoFocus
            />
          </Field>

          <Field
            label={
              <span>
                Length —{" "}
                <span className="num" style={{ color: "var(--ink)" }}>
                  {numDays} {numDays === 1 ? "day" : "days"}
                </span>
              </span>
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <input
                type="range"
                min={1}
                max={14}
                value={numDays}
                onChange={(e) => setNumDays(+e.target.value)}
                className="wf-range"
                style={{ flex: 1 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <Stepper onClick={() => setNumDays((d) => Math.max(1, d - 1))}>−</Stepper>
                <Stepper onClick={() => setNumDays((d) => Math.min(14, d + 1))}>+</Stepper>
              </div>
            </div>
          </Field>

          <Field label="Budget tier">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {BUDGET_TIERS.map((b) => {
                const on = tier === b.key;
                return (
                  <button
                    type="button"
                    key={b.key}
                    onClick={() => setTier(b.key)}
                    style={{
                      textAlign: "left",
                      padding: "13px 14px",
                      borderRadius: "var(--r)",
                      cursor: "pointer",
                      border: "1px solid " + (on ? "var(--ink)" : "var(--line-2)"),
                      background: on ? "var(--card-raised)" : "var(--card)",
                      boxShadow: on ? "var(--shadow-1)" : "none",
                      transition: "all .14s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{b.label}</span>
                      {tierGlyph(b.key)}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{b.note}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label={
              <span>
                Interests{" "}
                <span className="num" style={{ color: "var(--ink-3)" }}>
                  {interests.length}/8
                </span>
              </span>
            }
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {interests.map((it) => (
                <Chip key={it} active removable onRemove={() => toggle(it)}>
                  {it}
                </Chip>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s)).map((s) => (
                <Chip key={s} onClick={() => toggle(s)}>
                  + {s}
                </Chip>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                className="wf-input"
                style={{ ...inputStyle, padding: "8px 12px", fontSize: 13.5 }}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Add your own…"
              />
              <Button kind="quiet" size="sm" type="button" onClick={addCustom}>
                Add
              </Button>
            </div>
          </Field>

          {err && (
            <div
              className="fade"
              style={{
                fontSize: 13,
                color: "var(--accent-ink)",
                background: "var(--accent-wash)",
                border: "1px solid #F0C6B6",
                borderRadius: "var(--r)",
                padding: "10px 12px",
              }}
            >
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button kind="primary" size="lg" type="submit">
              Generate itinerary →
            </Button>
            <span className="label" style={{ color: "var(--ink-4)" }}>
              ~10s · Gemini 2.5 Flash
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stepper({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: "var(--r)",
        border: "1px solid var(--line-2)",
        background: "var(--card-raised)",
        fontSize: 18,
        color: "var(--ink)",
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Generation loading: staged agent trace ---------- */
const GEN_STEPS = [
  { t: "Reading your constraints", d: "Destination, length, budget tier, interests" },
  { t: "Pacing the days", d: "Distributing morning · afternoon · evening, avoiding overload" },
  { t: "Selecting activities", d: "Matching each stop to your interests" },
  { t: "Estimating the budget", d: "Flights, lodging, food, and per-activity costs" },
  { t: "Calibrating confidence", d: "Scoring how strong each recommendation is" },
];

export function GeneratingScreen({ input }: { input: CreateTripInput }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= GEN_STEPS.length) return;
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 1500);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
      }}
    >
      <div className="rise" style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Spinner size={20} color="var(--accent)" />
          <div className="label" style={{ color: "var(--accent)" }}>
            Agent working
          </div>
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Planning {input.destination}…</h1>
        <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "0 0 28px" }} className="mono">
          {input.numDays} days · {TIER_LABEL[input.budgetTier]} budget · {input.interests.length} interests
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {GEN_STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "todo";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "11px 0",
                  opacity: state === "todo" ? 0.4 : 1,
                  transition: "opacity .3s",
                }}
              >
                <div
                  style={{
                    marginTop: 1,
                    width: 18,
                    flex: "0 0 auto",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {state === "done" ? (
                    <CheckDot />
                  ) : state === "active" ? (
                    <Spinner size={16} color="var(--ink)" />
                  ) : (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        background: "var(--line-strong)",
                        display: "block",
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: state === "active" ? 600 : 500 }}>{s.t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckDot() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginTop: 1 }}>
      <circle cx="9" cy="9" r="8" fill="var(--good-wash)" stroke="var(--good)" strokeWidth="1.2" />
      <path
        d="M5.5 9.2l2.2 2.2 4-4.6"
        stroke="var(--good)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
