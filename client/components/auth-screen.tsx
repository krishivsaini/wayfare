"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button, Field, Logo, Spinner, inputStyle } from "./ui";

type Mode = "login" | "signup";

export function AuthScreen({ mode }: { mode: Mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const user = isSignup
        ? await api.signup({ email: email.trim().toLowerCase(), password: pw })
        : await api.login({ email: email.trim().toLowerCase(), password: pw });
      setUser(user);
      router.replace("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)" }}>
      {/* form side */}
      <div style={{ display: "flex", flexDirection: "column", padding: "34px 7vw" }}>
        <Link href="/" style={{ textDecoration: "none", width: "fit-content" }}>
          <Logo />
        </Link>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div className="rise" style={{ width: "100%", maxWidth: 380 }}>
            <div className="label" style={{ color: "var(--accent)", marginBottom: 14 }}>
              {isSignup ? "Create account" : "Welcome back"}
            </div>
            <h1 style={{ fontSize: 30, marginBottom: 8 }}>
              {isSignup ? "Plan your first trip." : "Sign in to Wayfare."}
            </h1>
            <p style={{ color: "var(--ink-2)", margin: "0 0 28px", fontSize: 15 }}>
              {isSignup
                ? "Describe where you're going — the agent drafts a day-by-day itinerary with its reasoning shown."
                : "Your trips and itineraries are waiting."}
            </p>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Email">
                <input
                  className="wf-input"
                  style={inputStyle}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password" hint={isSignup ? "At least 8 characters." : undefined}>
                <input
                  className="wf-input"
                  style={inputStyle}
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {err && (
                <div
                  className="fade"
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    background: "var(--accent-wash)",
                    border: "1px solid #F0C6B6",
                    borderRadius: "var(--r)",
                    fontSize: 13,
                    color: "var(--accent-ink)",
                  }}
                >
                  <span style={{ marginTop: 1 }}>⚠</span>
                  <span>{err}</span>
                </div>
              )}

              <Button kind="primary" size="lg" full type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Spinner size={16} color="#fff" /> {isSignup ? "Creating account…" : "Signing in…"}
                  </>
                ) : isSignup ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div style={{ marginTop: 22, fontSize: 14, color: "var(--ink-2)" }}>
              {isSignup ? "Already have an account? " : "New to Wayfare? "}
              <Link
                href={isSignup ? "/login" : "/signup"}
                style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </div>
          </div>
        </div>
        <div className="label" style={{ color: "var(--ink-4)" }}>
          Secure session · httpOnly cookie
        </div>
      </div>

      {/* diagram side */}
      <div
        style={{
          position: "relative",
          background: "var(--paper-2)",
          borderLeft: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        <AuthDiagram />
      </div>
    </div>
  );
}

function AuthDiagram() {
  const nodes = [
    { x: 140, y: 150, t: "DAY 01", l: "Fushimi Inari" },
    { x: 360, y: 250, t: "DAY 02", l: "Arashiyama" },
    { x: 200, y: 400, t: "DAY 03", l: "Higashiyama" },
    { x: 420, y: 520, t: "DAY 04", l: "Nara" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.5 }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 560 680"
      >
        <defs>
          <pattern id="wf-auth-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="var(--line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="680" fill="url(#wf-auth-grid)" />
      </svg>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 560 680"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={`M${nodes[0].x} ${nodes[0].y} Q 300 180 ${nodes[1].x} ${nodes[1].y} T ${nodes[2].x} ${nodes[2].y} Q 280 470 ${nodes[3].x} ${nodes[3].y}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          opacity="0.9"
        />
        {nodes.map((n, i) => (
          <g key={i} className="rise" style={{ animationDelay: i * 0.12 + "s" }}>
            <circle cx={n.x} cy={n.y} r="7" fill="var(--card-raised)" stroke="var(--ink)" strokeWidth="1.6" />
            <circle cx={n.x} cy={n.y} r="2.4" fill="var(--accent)" />
          </g>
        ))}
      </svg>
      {nodes.map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(${(n.x / 560) * 100}% + 16px)`,
            top: `calc(${(n.y / 680) * 100}% - 14px)`,
          }}
        >
          <div className="label" style={{ fontSize: 9.5, color: "var(--accent)" }}>
            {n.t}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{n.l}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 40, bottom: 36, maxWidth: 300 }}>
        <div className="label" style={{ marginBottom: 8 }}>
          The reasoning is the point
        </div>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
          Every stop carries a one-line rationale and a confidence read, so you can see <em>why</em> the agent chose it
          — and overrule it.
        </p>
      </div>
    </div>
  );
}
