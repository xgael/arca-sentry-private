"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "sentry-autodemo-seen";

type Step =
  | { kind: "welcome" }
  | { kind: "running"; scenario: string; progress: number }
  | { kind: "done"; scenario: string };

export default function AutoDemo({
  scenarios,
  onRunScenario,
}: {
  scenarios: string[];
  onRunScenario: (name: string) => void | Promise<void>;
}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "welcome" });

  // Show on first visit only
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && scenarios.length > 0) {
      // Small delay so the page settles first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [scenarios.length]);

  const close = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const playDemo = useCallback(async () => {
    const scenario = scenarios[0] || "credit_denial";
    setStep({ kind: "running", scenario, progress: 0 });

    // Animated progress bar (~3.5s total)
    const startedAt = performance.now();
    const duration = 3200;
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / duration);
      setStep({ kind: "running", scenario, progress: t * 100 });
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Trigger the actual scenario in parallel
    try {
      await onRunScenario(scenario);
    } catch {}

    // Hold "done" briefly then auto-close
    setStep({ kind: "done", scenario });
    setTimeout(close, 1600);
  }, [scenarios, onRunScenario, close]);

  if (!visible) return null;

  return (
    <div className="autodemo-backdrop" onClick={close}>
      <div className="autodemo" onClick={(e) => e.stopPropagation()}>
        <button className="autodemo-close" onClick={close} aria-label="Skip demo">
          <X size={16} />
        </button>

        {step.kind === "welcome" && (
          <>
            <div className="autodemo-icon">
              <Sparkles size={28} />
            </div>
            <h2>See SENTRY catch a violation in 3 seconds</h2>
            <p>
              We'll run a synthetic AI interaction through the full audit pipeline — five auditor
              agents in parallel, Gemini Pro synthesizer, append-only event log — and you'll watch the
              dashboard react in real time.
            </p>
            <div className="autodemo-actions">
              <button className="autodemo-primary" onClick={playDemo}>
                ▶ Play demo
              </button>
              <button className="autodemo-ghost" onClick={close}>
                Skip — I'll explore on my own
              </button>
            </div>
            <div className="autodemo-hint">
              Press <kbd>⌘K</kbd> any time to jump anywhere or switch themes.
            </div>
          </>
        )}

        {step.kind === "running" && (
          <>
            <div className="autodemo-icon running">
              <Sparkles size={28} />
            </div>
            <h2>Auditing · {step.scenario.replace(/_/g, " ")}</h2>
            <p>Five auditor agents fire in parallel. Watch the KPI cards, donut and live feed update.</p>
            <div className="autodemo-progress">
              <div className="autodemo-progress-fill" style={{ width: step.progress + "%" }} />
            </div>
            <div className="autodemo-stages">
              <Stage label="Capture" active={step.progress > 5} done={step.progress > 18} />
              <Stage label="Orchestrate" active={step.progress > 18} done={step.progress > 35} />
              <Stage label="5 Auditors" active={step.progress > 35} done={step.progress > 68} />
              <Stage label="Severity" active={step.progress > 68} done={step.progress > 82} />
              <Stage label="Synthesize" active={step.progress > 82} done={step.progress > 95} />
              <Stage label="Persist" active={step.progress > 95} done={step.progress >= 100} />
            </div>
          </>
        )}

        {step.kind === "done" && (
          <>
            <div className="autodemo-icon done">✓</div>
            <h2>Violation caught & logged</h2>
            <p>
              The drawer on the right shows the full forensic record — agents that fired, regulation
              cited, recommended remediation. Hover any row in the feed to inspect another audit.
            </p>
            <div className="autodemo-hint">
              Closing in a moment… press <kbd>⌘K</kbd> next to navigate.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stage({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`autodemo-stage ${done ? "done" : active ? "active" : ""}`}>
      <span className="autodemo-stage-dot" />
      <span>{label}</span>
    </div>
  );
}
