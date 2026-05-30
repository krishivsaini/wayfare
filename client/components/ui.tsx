"use client";
// Wayfare shared UI primitives — ported from design/ui.jsx.
// Keeps the design's inline-style + CSS-var approach; hover/focus rules live in globals.css.
import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

/* ---------- Wordmark ---------- */
export function WayMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.2" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M12 5.5 L14.7 12 L12 18.5 L9.3 12 Z" fill="var(--accent)" />
      <circle cx="12" cy="12" r="1.6" fill="var(--card-raised)" stroke="var(--ink)" strokeWidth="1.3" />
    </svg>
  );
}

export function Logo({ size = 18, mark = true }: { size?: number; mark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 600, letterSpacing: "-.02em", fontSize: size }}>
      {mark && <WayMark size={Math.round(size * 1.15)} />}
      <span>Wayfare</span>
    </span>
  );
}

/* ---------- Confidence: 4-bar signal glyph ---------- */
export function confTone(c: number) {
  if (c >= 0.85) return { key: "strong" as const, color: "var(--accent)", wash: "var(--accent-wash)" };
  if (c >= 0.6) return { key: "solid" as const, color: "var(--ink)", wash: "var(--paper-2)" };
  return { key: "low" as const, color: "var(--warn)", wash: "var(--warn-wash)" };
}

export function confidenceWord(c: number) {
  if (c >= 0.85) return "strong fit";
  if (c >= 0.7) return "solid";
  if (c >= 0.6) return "reasonable";
  return "experimental";
}

export function ConfidenceGlyph({ c, size = 1 }: { c: number; size?: number }) {
  const filled = Math.max(1, Math.round(c * 4));
  const tone = confTone(c);
  const heights = [6, 9, 12, 15].map((h) => h * size);
  const w = 3.5 * size;
  return (
    <span
      title={`${Math.round(c * 100)}% confidence`}
      style={{ display: "inline-flex", alignItems: "flex-end", gap: 2 * size, height: 15 * size }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: w,
            height: h,
            borderRadius: 1,
            background: i < filled ? tone.color : "var(--line-2)",
          }}
        />
      ))}
    </span>
  );
}

export function ConfidenceMeter({ c, mode = "glyph" }: { c: number; mode?: "glyph" | "percent" | "worded" }) {
  const tone = confTone(c);
  if (mode === "percent") {
    return (
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: tone.color }}>
        {Math.round(c * 100)}%
      </span>
    );
  }
  if (mode === "worded") {
    return (
      <span
        className="label"
        style={{ color: tone.color, background: tone.wash, padding: "3px 8px", borderRadius: 99, letterSpacing: ".1em" }}
      >
        {confidenceWord(c)}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <ConfidenceGlyph c={c} />
      <span className="label" style={{ color: tone.color, letterSpacing: ".1em" }}>
        {confidenceWord(c)}
      </span>
    </span>
  );
}

/* ---------- Buttons ---------- */
type ButtonKind = "primary" | "default" | "ghost" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  full?: boolean;
  children: ReactNode;
}

export function Button({ children, kind = "default", size = "md", full, style, className, ...rest }: ButtonProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--sans)",
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: "var(--r)",
    border: "1px solid transparent",
    transition: "background .14s, border-color .14s, color .14s, transform .06s, box-shadow .14s",
    width: full ? "100%" : "auto",
    whiteSpace: "nowrap",
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: "7px 12px", fontSize: 13 },
    md: { padding: "10px 16px", fontSize: 14 },
    lg: { padding: "13px 22px", fontSize: 15 },
  };
  const kinds: Record<ButtonKind, CSSProperties> = {
    primary: { background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-1)" },
    default: { background: "var(--card-raised)", color: "var(--ink)", borderColor: "var(--line-2)", boxShadow: "var(--shadow-1)" },
    ghost: { background: "transparent", color: "var(--ink-2)" },
    quiet: { background: "var(--paper-2)", color: "var(--ink)", borderColor: "var(--line)" },
    danger: { background: "transparent", color: "#A23A22", borderColor: "transparent" },
  };
  return (
    <button
      {...rest}
      className={`wf-btn wf-btn-${kind}${className ? " " + className : ""}`}
      style={{ ...base, ...sizes[size], ...kinds[kind], ...(style || {}) }}
    >
      {children}
    </button>
  );
}

/* ---------- Chips / pills ---------- */
export function Chip({
  children,
  active,
  onClick,
  removable,
  onRemove,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 11px",
        borderRadius: 99,
        fontSize: 13,
        border: "1px solid " + (active ? "var(--ink)" : "var(--line-2)"),
        background: active ? "var(--ink)" : "var(--card-raised)",
        color: active ? "var(--paper)" : "var(--ink-2)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .14s",
      }}
    >
      {children}
      {removable && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{ marginLeft: 1, opacity: 0.6, fontSize: 14, lineHeight: 1 }}
        >
          ×
        </span>
      )}
    </button>
  );
}

/* ---------- Form field ---------- */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      {label && <div className="label" style={{ marginBottom: 7 }}>{label}</div>}
      {children}
      {hint && !error && <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12.5, color: "#A23A22", marginTop: 6 }}>{error}</div>}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  fontSize: 14.5,
  background: "var(--card-raised)",
  color: "var(--ink)",
  border: "1px solid var(--line-2)",
  borderRadius: "var(--r)",
  outline: "none",
  transition: "border-color .14s, box-shadow .14s",
};

/* ---------- Tier dots ---------- */
export function tierGlyph(tier: string) {
  const map: Record<string, number> = { low: 1, medium: 2, high: 3, budget: 1, mid: 2, luxury: 3 };
  const n = map[tier] || 1;
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ width: 5, height: 5, borderRadius: 99, background: i < n ? "var(--ink)" : "var(--line-2)" }}
        />
      ))}
    </span>
  );
}

/* ---------- Time-of-day glyph ---------- */
export function TodGlyph({ tod }: { tod: "morning" | "afternoon" | "evening" }) {
  const paths = {
    morning: (
      <>
        <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </>
    ),
    afternoon: (
      <>
        <path d="M2 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 11a3 3 0 016 0" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 2v2M3 6l1 1M13 6l-1 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </>
    ),
    evening: (
      <path
        d="M13 9.5A5.5 5.5 0 116.5 3 4.5 4.5 0 0013 9.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--ink-3)" }} aria-hidden="true">
      {paths[tod]}
    </svg>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "wf-spin .8s linear infinite" }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.22" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Navbar ---------- */
export function Navbar({ userEmail, onLogout }: { userEmail: string; onLogout: () => void }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "color-mix(in srgb, var(--paper) 82%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 28px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Logo />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span className="label" style={{ color: "var(--ink-3)" }}>
            {userEmail}
          </span>
          <span style={{ width: 1, height: 18, background: "var(--line-2)" }} />
          <button
            onClick={onLogout}
            className="label"
            style={{ background: "none", border: 0, color: "var(--ink-2)", letterSpacing: ".12em", cursor: "pointer" }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
