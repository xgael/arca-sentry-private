"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import "../architecture/architecture.css";
import "../playground/playground.css";

type Settings = { enabled: boolean; min_severity: "warning" | "critical" };
type RewriteResp = { original: string; rewritten: string };
type HistItem = {
  record_id: string;
  created_at: string;
  regulation: string;
  article?: string;
  original: string;
  rewritten: string;
};

export default function AutofixPage() {
  const [enabled, setEnabled] = useState(false);
  const [severity, setSeverity] = useState<"warning" | "critical">("warning");
  const [original, setOriginal] = useState("");
  const [rationale, setRationale] = useState("");
  const [reg, setReg] = useState("eu_ai_act");
  const [article, setArticle] = useState("");
  const [lang, setLang] = useState("");
  const [result, setResult] = useState<RewriteResp | null>(null);
  const [history, setHistory] = useState<HistItem[]>([]);
  const [running, setRunning] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const loadSettings = useCallback(async () => {
    const d = await api<Settings>("/api/autofix/settings");
    if (d) {
      setEnabled(d.enabled);
      setSeverity(d.min_severity || "warning");
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const d = await api<{ items: HistItem[] }>("/api/autofix/history?limit=20");
    if (d?.items) setHistory(d.items);
  }, []);

  useEffect(() => {
    loadSettings();
    loadHistory();
    const t = setInterval(loadHistory, 8000);
    return () => clearInterval(t);
  }, [loadSettings, loadHistory]);

  const saveSettings = useCallback(
    async (next: { enabled?: boolean; min_severity?: "warning" | "critical" }) => {
      const merged = { enabled: next.enabled ?? enabled, min_severity: next.min_severity ?? severity };
      await fetch("/api/autofix/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
    },
    [enabled, severity],
  );

  const doRewrite = useCallback(async () => {
    if (!original.trim() || !rationale.trim()) {
      alert("Need both the original response and a rationale.");
      return;
    }
    setRunning(true);
    try {
      const r = await fetch("/api/autofix/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_response: original,
          finding_rationale: rationale,
          regulation: reg,
          article: article || null,
          language_hint: lang || null,
        }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = (await r.json()) as RewriteResp;
      setResult(d);
      setSessionTotal((n) => n + 1);
      loadHistory();
    } catch (e) {
      alert("Rewrite failed: " + (e instanceof Error ? e.message : e));
    } finally {
      setRunning(false);
    }
  }, [original, rationale, reg, article, lang, loadHistory]);

  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">In-line remediation</div>
          <h1 className="arch-hero-title">Don't block the user — rewrite the response</h1>
          <p className="arch-hero-sub">
            When the audit detects a violation, SENTRY can ask Gemini Pro to <strong>rewrite</strong> the
            response so the end user receives a compliant reply instead of an error. The original AND the
            rewrite are both stored — your compliance team reviews the diff, not a customer complaint.
          </p>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card"><div className="metric-val">{sessionTotal}</div><div className="metric-lbl">Rewrites this session</div></div>
          <div className="metric-card"><div className="metric-val">Gemini Pro</div><div className="metric-lbl">Rewriting engine</div></div>
          <div className="metric-card"><div className="metric-val">{enabled ? "ON" : "OFF"}</div><div className="metric-lbl">Current mode</div></div>
          <div className="metric-card"><div className="metric-val">5 lang</div><div className="metric-lbl">Output languages</div></div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Configuration</h2>
          <p className="muted">
            When enabled, SENTRY rewrites every response flagged at or above the minimum severity. When
            disabled, behaviour reverts to standard block/warn/allow.
          </p>
        </div>
        <div className="af-toggle-wrap">
          <label className="af-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                saveSettings({ enabled: e.target.checked });
              }}
            />
            <span className="af-toggle-track"><span className="af-toggle-knob" /></span>
            <span className="af-toggle-label">Enable auto-rewrite</span>
          </label>
          <label className="af-severity">
            <span>Trigger when severity ≥</span>
            <select
              value={severity}
              onChange={(e) => {
                const s = e.target.value as typeof severity;
                setSeverity(s);
                saveSettings({ min_severity: s });
              }}
            >
              <option value="warning">Warning</option>
              <option value="critical">Critical only</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Try a rewrite</h2>
          <p className="muted">
            Paste an offending response and SENTRY rewrites it to be compliant. Powered by Gemini Pro.
          </p>
        </div>
        <div className="af-form">
          <label>
            <span>Original bot response</span>
            <textarea
              rows={3}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Your loan application was automatically denied. We cannot provide further details."
            />
          </label>
          <div className="af-row">
            <label className="grow">
              <span>Regulation violated</span>
              <select value={reg} onChange={(e) => setReg(e.target.value)}>
                <option value="eu_ai_act">EU AI Act</option>
                <option value="gdpr">GDPR</option>
                <option value="dora">DORA</option>
                <option value="pii_leak">PII Leak</option>
                <option value="prompt_injection">Prompt Injection</option>
              </select>
            </label>
            <label>
              <span>Article (optional)</span>
              <input
                type="text"
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="e.g. Art. 13"
              />
            </label>
            <label>
              <span>Language</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="">auto</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
              </select>
            </label>
          </div>
          <label>
            <span>Why it violates (rationale)</span>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="The bot refused a credit decision without offering explanation or human review path."
            />
          </label>
          <button className="rt-run-btn" disabled={running} onClick={doRewrite}>
            {running ? "⏳ Rewriting with Gemini Pro…" : "✨ Rewrite with Gemini Pro"}
          </button>
        </div>

        {result && (
          <div className="af-result">
            <div className="af-diff">
              <div className="af-pane">
                <div className="af-pane-head">Before (non-compliant)</div>
                <div className="af-pane-body">{result.original}</div>
              </div>
              <div className="af-pane after">
                <div className="af-pane-head">After (compliant)</div>
                <div className="af-pane-body">{result.rewritten}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Recent rewrites</h2>
          <p className="muted">Last 20 rewrites issued. Click any row to expand the before/after diff.</p>
        </div>
        <div className="af-history">
          {history.length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: "center" }}>
              No rewrites yet.
            </div>
          ) : (
            history.map((it) => {
              const time = new Date(it.created_at).toLocaleTimeString("en-GB");
              return (
                <div
                  key={it.record_id}
                  className="af-hist-item"
                  onClick={() => setResult({ original: it.original, rewritten: it.rewritten })}
                >
                  <div className="af-hist-head">
                    <div>
                      <strong>{it.regulation}</strong>
                      {it.article && <span className="muted small"> · {it.article}</span>}
                    </div>
                    <span className="af-hist-meta">
                      {time} · {it.record_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="af-hist-snippet">
                    {(it.rewritten || "").slice(0, 200)}…
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
