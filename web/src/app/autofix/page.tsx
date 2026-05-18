"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import { apiGet, apiPost } from "@/lib/api";
import { toast } from "@/components/ui/toast";

interface AutofixSettings {
  enabled: boolean;
  min_severity: "warning" | "critical";
}

interface AutofixHistory {
  items: Array<{
    record_id: string;
    created_at: string;
    regulation: string;
    article?: string | null;
    original: string;
    rewritten: string;
  }>;
}

interface RewriteResponse {
  original: string;
  rewritten: string;
}

export default function AutofixPage() {
  const [enabled, setEnabled] = useState(false);
  const [severity, setSeverity] = useState<"warning" | "critical">("warning");
  const [total, setTotal] = useState(0);

  const [original, setOriginal] = useState("");
  const [rationale, setRationale] = useState("");
  const [regulation, setRegulation] = useState("eu_ai_act");
  const [article, setArticle] = useState("");
  const [lang, setLang] = useState("");
  const [running, setRunning] = useState(false);

  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [history, setHistory] = useState<AutofixHistory["items"]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const stickyToastIdRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const d = await apiGet<AutofixHistory>("/autofix/history?limit=20");
      setHistory(d.items ?? []);
    } catch {/* ignore */}
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    apiGet<AutofixSettings>("/autofix/settings")
      .then((d) => {
        setEnabled(d.enabled);
        setSeverity(d.min_severity ?? "warning");
      })
      .catch(() => {});
    void loadHistory();
    const id = setInterval(loadHistory, 8000);
    return () => clearInterval(id);
  }, [loadHistory]);

  const saveSettings = useCallback(
    async (next: Partial<AutofixSettings>) => {
      const payload = { enabled, min_severity: severity, ...next };
      setEnabled(payload.enabled);
      setSeverity(payload.min_severity);
      try {
        await apiPost<AutofixSettings>("/autofix/settings", payload);
      } catch {/* ignore */}
    },
    [enabled, severity],
  );

  // Sticky toast reflecting Auto-Fix mode. Dismisses + re-shows on changes so
  // the button's closure captures the current severity.
  useEffect(() => {
    if (stickyToastIdRef.current) {
      toast.dismiss(stickyToastIdRef.current);
      stickyToastIdRef.current = null;
    }
    if (!enabled) return;
    stickyToastIdRef.current = toast.show({
      variant: "info",
      title: "Auto-Fix is ON",
      description: `Rewriting responses with severity ≥ ${severity}`,
      icon: "✨",
      duration: null,
      button: { title: "Disable", onClick: () => { void saveSettings({ enabled: false }); } },
    });
    return () => {
      if (stickyToastIdRef.current) {
        toast.dismiss(stickyToastIdRef.current);
        stickyToastIdRef.current = null;
      }
    };
  }, [enabled, severity, saveSettings]);

  async function doRewrite() {
    if (!original.trim() || !rationale.trim()) {
      toast.warning("Missing input", "Need both the original response and a rationale.");
      return;
    }
    setRunning(true);
    try {
      const d = await toast.promise(
        apiPost<RewriteResponse>("/autofix/rewrite", {
          original_response: original.trim(),
          finding_rationale: rationale.trim(),
          regulation,
          article: article || null,
          language_hint: lang || null,
        }),
        {
          loading: { title: "Rewriting with Gemini Pro…", description: "2-4 seconds" },
          success: () => ({
            title: "Rewrite ready",
            description: "Review the before/after diff below.",
          }),
          error: (err) => ({
            title: "Rewrite failed",
            description: err instanceof Error ? err.message : String(err),
          }),
        },
      );
      setResult(d);
      setTotal((n) => n + 1);
      await loadHistory();
    } catch {/* error toast already shown */}
    finally { setRunning(false); }
  }

  return (
    <>
      <Topbar pageKey="autofix" />
      <main className="arch-main">
        <div className="page-head">
          <div className="page-head-row">
            <div>
              <h1>Auto-Fix</h1>
              <p className="muted">Rewrites flagged responses inline so the end user gets a compliant reply.</p>
            </div>
            <div className="page-head-stats">
              <span><strong>{total}</strong> rewrites this session</span>
            </div>
          </div>
        </div>

        <Card className="arch-card" title="Configuration" subtitle="When enabled, SENTRY rewrites every response flagged at or above the minimum severity. When disabled, behaviour reverts to standard block/warn/allow.">
          <div className="af-toggle-wrap">
            <label className="af-toggle">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => saveSettings({ enabled: e.target.checked })}
              />
              <span className="af-toggle-track"><span className="af-toggle-knob" /></span>
              <span className="af-toggle-label">Enable auto-rewrite</span>
            </label>
            <label className="af-severity">
              <span>Trigger when severity ≥</span>
              <select
                value={severity}
                onChange={(e) => saveSettings({ min_severity: e.target.value as "warning" | "critical" })}
              >
                <option value="warning">Warning</option>
                <option value="critical">Critical only</option>
              </select>
            </label>
          </div>
        </Card>

        <Card className="arch-card" title="Try a rewrite" subtitle="Paste an offending response and SENTRY rewrites it to be compliant. Powered by Gemini Pro.">
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
              <label>
                <span>Regulation violated</span>
                <select value={regulation} onChange={(e) => setRegulation(e.target.value)}>
                  <option value="eu_ai_act">EU AI Act</option>
                  <option value="gdpr">GDPR</option>
                  <option value="dora">DORA</option>
                  <option value="pii_leak">PII Leak</option>
                  <option value="prompt_injection">Prompt Injection</option>
                </select>
              </label>
              <label>
                <span>Article (optional)</span>
                <input type="text" value={article} onChange={(e) => setArticle(e.target.value)} placeholder="e.g. Art. 13" />
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
            <button type="button" className="rt-run-btn" onClick={doRewrite} disabled={running}>
              {running ? "⏳ Rewriting with Gemini Pro…" : "✨ Rewrite with Gemini Pro"}
            </button>
          </div>

          {result && (
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
          )}
        </Card>

        <Card className="arch-card" title="Recent rewrites" subtitle="Last 20 rewrites issued. Click any row to expand the before/after diff.">
          <div className="af-history">
            {historyLoading && history.length === 0 && (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton-card">
                    <span className="skeleton-line w-third" />
                    <span className="skeleton-line w-full" />
                  </div>
                ))}
              </>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="list-empty">
                <div className="list-empty-mark">✨</div>
                <div className="list-empty-title">No rewrites yet</div>
                <div className="list-empty-desc">
                  Try the form above — paste an offending response and a rationale, and SENTRY rewrites it with Gemini Pro.
                </div>
              </div>
            )}
            {history.map((it) => (
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
                    {new Date(it.created_at).toLocaleTimeString("en-GB")} · {(it.record_id ?? "").slice(0, 8)}
                  </span>
                </div>
                <div className="af-hist-snippet">{(it.rewritten ?? "").slice(0, 200)}…</div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <footer className="footer">
        © ARCA SENTRY
      </footer>
    </>
  );
}
