"use client";
// Cold-start gate. The API lives on Render's free tier, which sleeps the
// instance after ~15 min of inactivity — the first request then takes 30–60s
// while the container boots. Without this, a reviewer opening the deployed app
// sees a blank screen or a failed /auth/me and reads it as a broken deploy.
// We poll /health first and render the app only once the server answers.
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button, Logo, Spinner } from "./ui";

const PANEL_AFTER_MS = 900; // warm backend answers first — no flash of the panel
const ATTEMPT_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 2000;
const STALL_AFTER_MS = 90000;
const EXPECTED_WAKE_S = 45; // what the progress bar paces against

type Phase = "probing" | "ready" | "stalled";

export function WakeGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("probing");
  const [showPanel, setShowPanel] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [nonce, setNonce] = useState(0); // bumped by "Try again" to restart the probe
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    startedAt.current = Date.now();
    setSeconds(0);
    setShowPanel(false);
    setPhase("probing");

    const panelTimer = setTimeout(() => !cancelled && setShowPanel(true), PANEL_AFTER_MS);

    (async function probe() {
      while (!cancelled) {
        const ctrl = new AbortController();
        const attemptTimer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
        try {
          await api.wake(ctrl.signal);
          clearTimeout(attemptTimer);
          if (!cancelled) setPhase("ready");
          return;
        } catch {
          // A sleeping instance refuses the connection or 502s until it's up —
          // every failure here is expected, so just keep knocking.
          clearTimeout(attemptTimer);
          if (cancelled) return;
          if (Date.now() - startedAt.current > STALL_AFTER_MS) {
            setPhase("stalled");
            return;
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(panelTimer);
    };
  }, [nonce]);

  useEffect(() => {
    if (phase === "ready") return;
    const id = setInterval(
      () => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)),
      500
    );
    return () => clearInterval(id);
  }, [phase, nonce]);

  if (phase === "ready") return <>{children}</>;

  // Hold the paint for a beat so a warm server never flashes the panel.
  if (!showPanel) return <div style={{ minHeight: "100vh" }} />;

  const stalled = phase === "stalled";
  const pct = Math.min(92, Math.round((seconds / EXPECTED_WAKE_S) * 100));

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 24px" }}
    >
      <div className="rise" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ marginBottom: 26 }}>
          <Logo />
        </div>

        <div
          className="label"
          style={{ color: stalled ? "var(--warn)" : "var(--accent)", marginBottom: 12 }}
        >
          {stalled ? "Still waiting" : "Cold start"}
        </div>

        <h1 style={{ fontSize: 26, margin: "0 0 10px", letterSpacing: "-.02em" }}>
          {stalled ? "The server is taking longer than usual." : "Waking the server…"}
        </h1>

        <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
          {stalled ? (
            <>
              A Render cold start is normally under a minute. The instance may still be booting —
              keep waiting, or try the probe again.
            </>
          ) : (
            <>
              The API runs on Render&apos;s free tier, so it sleeps after a spell of inactivity and
              the first request has to spin it back up — usually 30–50 seconds. Wayfare loads as
              soon as it&apos;s awake.
            </>
          )}
        </p>

        {!stalled && (
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: "var(--line-2)",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: "var(--accent)",
                borderRadius: 99,
                transition: "width .5s linear",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            className="label"
            style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "var(--ink-3)" }}
          >
            {!stalled && <Spinner size={13} color="var(--ink-3)" />}
            Waiting for the API
          </span>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
            {seconds}s
          </span>
        </div>

        {stalled && (
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button kind="primary" onClick={() => setNonce((n) => n + 1)}>
              Try again
            </Button>
            <Button kind="ghost" onClick={() => setPhase("ready")}>
              Continue anyway
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
