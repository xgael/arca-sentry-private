"use client";

/**
 * BackendStatusBanner — sticky top strip that surfaces when the FastAPI
 * backend can't be reached. Polls `/api/health` every 8s. When the request
 * fails (CORS, 5xx, network error), shows a slim red banner with a Retry
 * button. The banner self-dismisses the moment a successful ping lands.
 *
 * The previous behaviour was a silent UI: empty KPIs, blank charts, and a
 * console full of CORS errors — nothing told the user what was wrong.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

type Status = "unknown" | "ok" | "down";

const POLL_MS = 8_000;

export default function BackendStatusBanner() {
  const [status, setStatus] = useState<Status>("unknown");
  const [retrying, setRetrying] = useState(false);
  const inflight = useRef<AbortController | null>(null);

  const ping = useCallback(async () => {
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    try {
      const r = await fetch("/api/health", {
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (r.ok) setStatus("ok");
      else setStatus("down");
    } catch {
      // Network error, abort, anything → treat as down (CORS errors land here too).
      if (!ctrl.signal.aborted) setStatus("down");
    }
  }, []);

  useEffect(() => {
    void ping();
    const id = setInterval(() => { void ping(); }, POLL_MS);
    return () => {
      clearInterval(id);
      inflight.current?.abort();
    };
  }, [ping]);

  async function onRetry() {
    setRetrying(true);
    await ping();
    // Tiny delay so the spinner is visible even when the request resolves
    // instantly — feels more honest than a flicker.
    setTimeout(() => setRetrying(false), 350);
  }

  if (status !== "down") return null;

  return (
    <div className="backend-banner" role="status" aria-live="polite">
      <div className="backend-banner-inner">
        <AlertCircle className="backend-banner-icon" aria-hidden="true" />
        <div className="backend-banner-text">
          <strong>Backend offline.</strong>
          <span className="backend-banner-meta">
            <code>/api/health</code> didn&apos;t respond. Live data won&apos;t load
            until the FastAPI server is running on the port set in
            <code>next.config.ts</code>.
          </span>
        </div>
        <button
          type="button"
          className="backend-banner-retry"
          onClick={onRetry}
          disabled={retrying}
          aria-label="Retry health check"
        >
          <RefreshCw className={`icon-svg ${retrying ? "spin" : ""}`} aria-hidden="true" />
          <span>{retrying ? "Retrying…" : "Retry"}</span>
        </button>
      </div>
    </div>
  );
}
