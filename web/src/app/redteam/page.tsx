"use client";

// ARCA SENTRY — Red Team page (Next.js port of redteam.html + redteam.js).
//
// Endpoint mapping (per migration brief):
//   POST /redteam/run         { agent_id | provider+model+api_key, max_attacks }
//   GET  /redteam/categories  (optional metadata)
//
// Additional endpoints used (from legacy backend):
//   GET  /redteam/catalog     { total }
//   GET  /agents              { agents: AgentCard[] }
//   POST /redteam/report.pdf  { ...lastReport }

import { useCallback, useEffect, useRef, useState } from "react";

import Topbar from "@/components/chrome/Topbar";
import { apiGet, apiPost, apiUrl } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { escapeHtml } from "@/lib/format";
import { toast } from "@/components/ui/toast";

/* ─────────────── API types ─────────────── */

type Provider = "openai" | "anthropic" | "gemini";

interface AgentCard {
  id: string;
  name: string;
  icon: string;
  vertical: string;
  status: string;
  description: string;
  model: string;
  regulations?: string[];
  total_audits: number;
  warnings_caught: number;
  criticals_caught: number;
  last_audited_at?: string | null;
}

interface AgentListResponse {
  agents: AgentCard[];
}

interface CategoriesResponse {
  categories: Array<{ id: string; label: string }>;
}

interface CatalogResponse {
  total: number;
}

interface RedTeamResult {
  category: string;
  name: string;
  vulnerable: boolean;
  prompt?: string;
  response?: string;
}

interface RedTeamSummary {
  resilience_score: number;
  total: number;
  vulnerable: number;
  by_category: Record<string, { vulnerable: number; total: number }>;
}

interface RedTeamReport {
  summary: RedTeamSummary;
  results: RedTeamResult[];
  target: { provider: string; model: string };
  completed_at: string;
}

interface CustomFormState {
  provider: Provider;
  model: string;
  apiKey: string;
  systemPrompt: string;
}

/* ─────────────── Helpers ─────────────── */

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function scoreClass(score: number): "low" | "mid" | "" {
  if (score < 60) return "low";
  if (score < 85) return "mid";
  return "";
}

/* ─────────────── Page ─────────────── */

export default function RedTeamPage() {
  const { t } = useT();

  const [catalogCount, setCatalogCount] = useState<number | "—">("—");
  const [agents, setAgents] = useState<AgentCard[] | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runningTitle, setRunningTitle] = useState<string>(t("rt.running.title"));
  const [runningSub, setRunningSub] = useState<string>(t("rt.running.sub"));
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string>(t("rt.running.init"));
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [report, setReport] = useState<RedTeamReport | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const resultsCardRef = useRef<HTMLDivElement>(null);

  const [custom, setCustom] = useState<CustomFormState>({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
    systemPrompt: "",
  });

  const [pdfStatus, setPdfStatus] = useState<string>(t("rt.export.pdf"));
  const [copyStatus, setCopyStatus] = useState<string>(t("rt.export.copy"));
  const [shareStatus, setShareStatus] = useState<string>(t("rt.export.share"));

  /* ───── Initial data ───── */
  useEffect(() => {
    (async () => {
      try {
        const d = await apiGet<CatalogResponse>("/redteam/catalog");
        if (typeof d.total === "number") setCatalogCount(d.total);
      } catch {
        // ignore
      }
      try {
        // TODO: brief mentions GET /redteam/categories — optional metadata. Ignored if absent.
        await apiGet<CategoriesResponse>("/redteam/categories").catch(() => null);
      } catch {
        // ignore
      }
      try {
        const d = await apiGet<AgentListResponse>("/agents");
        setAgents(d.agents ?? []);
      } catch {
        setAgentsError("Could not load agents.");
      }
    })();
  }, []);

  /* ───── Run pen test ───── */
  const startProgress = useCallback(() => {
    setProgress(5);
    setProgressLabel(t("rt.running.init"));
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(95, prev + Math.random() * 4);
        setProgressLabel(`Running attacks · ${Math.round(next)}%`);
        return next;
      });
    }, 900);
  }, [t]);

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    setProgressLabel(t("rt.running.complete"));
  }, [t]);

  const runOnAgent = useCallback(
    async (agent: AgentCard) => {
      setRunning(true);
      setReport(null);
      setRunningTitle(`Pen-testing · ${agent.name}`);
      setRunningSub(
        `Sending the full attack catalog against ${agent.name}. ${agent.vertical} agent, ${agent.model}.`,
      );
      startProgress();
      try {
        const data = await toast.promise(
          apiPost<RedTeamReport>("/redteam/run", {
            agent_id: agent.id,
            max_attacks: 12,
          }),
          {
            loading: {
              title: `Pen-testing ${agent.name}`,
              description: "Running 12 attacks · up to 30s",
            },
            success: (r) => ({
              title: `Score: ${r.summary.resilience_score}/100`,
              description: `${r.summary.vulnerable}/${r.summary.total} attacks landed`,
            }),
            error: (err) => ({
              title: "Pen test failed",
              description: err instanceof Error ? err.message : String(err),
            }),
          },
        );
        stopProgress();
        setTimeout(() => {
          setRunning(false);
          setTargetName(agent.name);
          setReport(data);
        }, 350);
      } catch {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setRunning(false);
      }
    },
    [startProgress, stopProgress],
  );

  const runCustom = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!custom.apiKey.trim()) {
        alert("API key required for custom agent.");
        return;
      }
      setRunning(true);
      setReport(null);
      setRunningTitle(`Pen-testing · custom ${custom.provider}/${custom.model}`);
      setRunningSub("Sending attacks against your external endpoint.");
      startProgress();
      try {
        const data = await toast.promise(
          apiPost<RedTeamReport>("/redteam/run", {
            provider: custom.provider,
            model: custom.model,
            api_key: custom.apiKey,
            system_prompt: custom.systemPrompt || null,
            max_attacks: 12,
          }),
          {
            loading: {
              title: `Pen-testing custom ${custom.provider}/${custom.model}`,
              description: "Running attacks · up to 30s",
            },
            success: (r) => ({
              title: `Score: ${r.summary.resilience_score}/100`,
              description: `${r.summary.vulnerable}/${r.summary.total} attacks landed`,
            }),
            error: (err) => ({
              title: "Pen test failed",
              description: err instanceof Error ? err.message : String(err),
            }),
          },
        );
        stopProgress();
        setTimeout(() => {
          setRunning(false);
          setTargetName(`${custom.provider}/${custom.model}`);
          setReport(data);
        }, 350);
      } catch {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setRunning(false);
      }
    },
    [custom, startProgress, stopProgress],
  );

  /* ───── Scroll into view when a report arrives ───── */
  useEffect(() => {
    if (report && resultsCardRef.current) {
      resultsCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  /* ───── Cleanup ───── */
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  /* ───── Export actions ───── */
  const downloadPdf = useCallback(async () => {
    if (!report) return;
    setPdfStatus("⏳ Generating PDF…");
    try {
      const r = await fetch(apiUrl("/redteam/report.pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentry-redteam-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPdfStatus("✓ Downloaded · click to download again");
    } catch (e) {
      setPdfStatus(`❌ Failed · ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTimeout(() => setPdfStatus(t("rt.export.pdf")), 4000);
    }
  }, [report, t]);

  const copySummary = useCallback(() => {
    if (!report) return;
    const s = report.summary;
    const tgt = report.target;
    const text = `ARCA SENTRY · Red Team Report
Target: ${tgt.provider}/${tgt.model}
Date: ${report.completed_at}

Resilience score: ${s.resilience_score}%
Attacks executed: ${s.total}
Vulnerable: ${s.vulnerable}
Resisted: ${s.total - s.vulnerable}

By category:
${Object.entries(s.by_category)
  .map(([c, b]) => `  · ${c}: ${b.vulnerable}/${b.total} vulnerable`)
  .join("\n")}

Top vulnerabilities:
${report.results
  .filter((r) => r.vulnerable)
  .slice(0, 5)
  .map((r) => `  · [${r.category}] ${r.name}`)
  .join("\n")}

Generated by ARCA SENTRY`;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus("✓ Copied to clipboard");
        setTimeout(() => setCopyStatus(t("rt.export.copy")), 2500);
      },
      () => alert("Could not copy. Select the text manually."),
    );
  }, [report, t]);

  const shareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareStatus("✓ Link copied · paste anywhere");
      setTimeout(() => setShareStatus(t("rt.export.share")), 2500);
    });
  }, [t]);

  /* ─────────────── Render ─────────────── */
  return (
    <>
      <Topbar pageKey="redteam" />

      <main className="arch-main">
        {/* HERO */}
        <section className="arch-hero">
          <div className="arch-hero-text">
            <div className="pg-hero-eyebrow">{t("rt.hero.eyebrow")}</div>
            <h1 className="arch-hero-title">{t("rt.hero.title")}</h1>
            <p className="arch-hero-sub">{t("rt.hero.sub")}</p>
          </div>
          <div className="arch-hero-metrics">
            <div className="metric-card">
              <div className="metric-val">{catalogCount}</div>
              <div className="metric-lbl">{t("rt.metric.catalog")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">~120 s</div>
              <div className="metric-lbl">{t("rt.metric.runtime")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">9</div>
              <div className="metric-lbl">{t("rt.metric.categories")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">0–100</div>
              <div className="metric-lbl">{t("rt.metric.score")}</div>
            </div>
          </div>
        </section>

        {/* TARGET PICKER */}
        <section className="card arch-card">
          <div className="card-head">
            <h2>{t("rt.target.title")}</h2>
            <p className="muted">{t("rt.target.desc")}</p>
          </div>

          <div className="rt-agent-grid">
            {agents === null && !agentsError ? (
              <div className="muted" style={{ padding: "24px", textAlign: "center" }}>
                {t("rt.target.loading")}
              </div>
            ) : agentsError ? (
              <div className="muted">{agentsError}</div>
            ) : (
              (agents ?? []).map((a) => (
                <div
                  key={a.id}
                  className="rt-agent-card"
                  title="Click anywhere on this card to open the agent profile · use the red button to run pen test"
                  onClick={() => {
                    window.location.href = `/agent?id=${encodeURIComponent(a.id)}`;
                  }}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = `/agent?id=${encodeURIComponent(a.id)}`;
                    }
                  }}
                >
                  <div className="rt-ag-head">
                    <div className="rt-ag-icon">{a.icon}</div>
                    <div className="rt-ag-info">
                      <div className="rt-ag-name">{a.name}</div>
                      <div className="rt-ag-vertical">{a.vertical}</div>
                    </div>
                    <span
                      className={`rt-ag-status${a.status === "active" ? " active" : ""}`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <div className="rt-ag-desc">{a.description}</div>

                  <div className="rt-ag-tags">
                    {(a.regulations ?? []).map((r) => (
                      <span key={r} className="rt-ag-tag">
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="rt-ag-meta">
                    <div className="rt-ag-meta-item">
                      <div className="val">{a.total_audits}</div>
                      <div className="lbl">Audits</div>
                    </div>
                    <div className="rt-ag-meta-item">
                      <div className="val warn">{a.warnings_caught}</div>
                      <div className="lbl">Warnings</div>
                    </div>
                    <div className="rt-ag-meta-item">
                      <div className="val crit">{a.criticals_caught}</div>
                      <div className="lbl">Criticals</div>
                    </div>
                  </div>
                  <div className="rt-ag-meta-time muted small">
                    Last audited: {formatTime(a.last_audited_at)}
                  </div>

                  <button
                    type="button"
                    className="rt-ag-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      runOnAgent(a);
                    }}
                  >
                    {t("rt.results.run_cta")}
                  </button>
                </div>
              ))
            )}
          </div>

          <details className="rt-custom-fold">
            <summary>{t("rt.custom.summary")}</summary>
            <form className="rt-form" onSubmit={runCustom}>
              <div className="rt-grid">
                <label>
                  <span>{t("rt.custom.provider")}</span>
                  <select
                    value={custom.provider}
                    onChange={(e) =>
                      setCustom((c) => ({ ...c, provider: e.target.value as Provider }))
                    }
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </label>
                <label>
                  <span>{t("rt.custom.model")}</span>
                  <input
                    type="text"
                    value={custom.model}
                    onChange={(e) => setCustom((c) => ({ ...c, model: e.target.value }))}
                    placeholder="e.g. gpt-4o-mini"
                  />
                </label>
                <label className="full">
                  <span>{t("rt.custom.key")}</span>
                  <input
                    type="password"
                    value={custom.apiKey}
                    onChange={(e) => setCustom((c) => ({ ...c, apiKey: e.target.value }))}
                    placeholder="sk-…  or  sk-ant-…  or  AIza…"
                    autoComplete="off"
                  />
                </label>
                <label className="full">
                  <span>{t("rt.custom.system")}</span>
                  <textarea
                    rows={2}
                    value={custom.systemPrompt}
                    onChange={(e) =>
                      setCustom((c) => ({ ...c, systemPrompt: e.target.value }))
                    }
                    placeholder="You are a helpful customer-service agent for ACME Bank…"
                  />
                </label>
              </div>
              <div className="rt-actions">
                <button type="submit" className="rt-run-btn">
                  {t("rt.custom.run")}
                </button>
              </div>
            </form>
          </details>
        </section>

        {/* RUNNING STATE */}
        {running && (
          <section className="card arch-card">
            <div className="card-head">
              <h2>{runningTitle}</h2>
              <p className="muted">{runningSub}</p>
            </div>
            <div className="rt-progress-bar">
              <div className="rt-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="rt-progress-label">{progressLabel}</div>
          </section>
        )}

        {/* RESULTS */}
        {report && (
          <section className="card arch-card" ref={resultsCardRef}>
            <div className="card-head">
              <h2>{t("rt.results.title")}</h2>
              <p className="muted">
                Target: {targetName}. {report.summary.vulnerable}/{report.summary.total}{" "}
                attacks succeeded.{" "}
                {report.summary.resilience_score >= 85
                  ? "Strong resilience — minor gaps only."
                  : report.summary.resilience_score >= 60
                  ? "Several gaps — review red rows below."
                  : "Major gaps — urgent remediation needed."}
              </p>
            </div>

            <div className="rt-score-band">
              <div className="rt-score">
                <div className={`rt-score-val ${scoreClass(report.summary.resilience_score)}`}>
                  {report.summary.resilience_score}%
                </div>
                <div className="rt-score-lbl">{t("rt.results.score")}</div>
              </div>
              <div className="rt-score-breakdown">
                {Object.entries(report.summary.by_category).map(([cat, b]) => (
                  <div key={cat} className="rt-breakdown-item">
                    <span className="cat">{cat}</span>
                    <span className={`ratio ${b.vulnerable > 0 ? "fail" : "ok"}`}>
                      {b.vulnerable}/{b.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rt-results">
              {report.results.map((r, i) => (
                <div
                  key={`${r.category}-${r.name}-${i}`}
                  className={`rt-result${r.vulnerable ? " vulnerable" : ""}`}
                >
                  <div className="rt-result-head">
                    <span className="cat-tag">{escapeHtml(r.category)}</span>
                    <span className="name">{escapeHtml(r.name)}</span>
                    <span className="verdict">
                      {r.vulnerable ? t("rt.results.vulnerable") : t("rt.results.resisted")}
                    </span>
                  </div>
                  {r.vulnerable ? (
                    <div className="rt-result-body">
                      <div className="rt-prompt-block">
                        <div className="rt-block-label">{t("rt.results.attacker_prompt")}</div>
                        <code className="rt-prompt-code">{r.prompt ?? ""}</code>
                      </div>
                      <div className="rt-response-block">
                        <div className="rt-block-label">{t("rt.results.bot_response")}</div>
                        <code className="rt-response-code">
                          {(r.response ?? "").slice(0, 320)}
                          {(r.response ?? "").length > 320 ? "…" : ""}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="rt-result-body">
                      <div className="rt-prompt-block">
                        <div className="rt-block-label muted">{t("rt.results.attempted")}</div>
                        <code className="rt-prompt-code muted">
                          {(r.prompt ?? "").slice(0, 140)}
                          {(r.prompt ?? "").length > 140 ? "…" : ""}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rt-export-bar">
              <button
                type="button"
                className="rt-export-btn primary"
                onClick={downloadPdf}
                disabled={pdfStatus.startsWith("⏳")}
              >
                {pdfStatus}
              </button>
              <button type="button" className="rt-export-btn" onClick={copySummary}>
                {copyStatus}
              </button>
              <button type="button" className="rt-export-btn" onClick={shareLink}>
                {shareStatus}
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
