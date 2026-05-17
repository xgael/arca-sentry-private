"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  CircleDot,
  MessageSquare,
  ShieldX,
  Target,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import "../architecture/architecture.css";
import "../playground/playground.css";
import "./redteam.css";

type Agent = {
  id: string;
  name: string;
  icon: string;
  vertical: string;
  status: string;
  description: string;
  regulations?: string[];
  total_audits: number;
  warnings_caught: number;
  criticals_caught: number;
  last_audited_at?: string;
  model: string;
};

type AttackResult = {
  category: string;
  name: string;
  vulnerable: boolean;
  prompt?: string;
  response?: string;
};

type Report = {
  target: { provider: string; model: string };
  completed_at: string;
  summary: {
    resilience_score: number;
    total: number;
    vulnerable: number;
    by_category: Record<string, { vulnerable: number; total: number }>;
  };
  results: AttackResult[];
};

type StreamItem =
  | { state: "pending"; key: number }
  | { state: "running"; key: number; category: string; name: string }
  | { state: "done"; key: number; result: AttackResult };

export default function RedTeamPage() {
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [running, setRunning] = useState<{ title: string; sub: string } | null>(null);
  const [streamed, setStreamed] = useState<StreamItem[]>([]);
  const [progressLabel, setProgressLabel] = useState("Initializing…");
  const [report, setReport] = useState<{ data: Report; targetName: string } | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [provider, setProvider] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ total: number }>("/api/redteam/catalog").then((d) => {
      if (d) setCatalogCount(d.total);
    });
    api<{ agents: Agent[] }>("/api/agents").then((d) => {
      setAgents(d?.agents ?? []);
    });
  }, []);

  useEffect(() => {
    if (report && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  // Animate streamed results when the report arrives. Each attack appears
  // in a "running" state, holds briefly, then flips to its final result.
  const streamResults = useCallback(async (results: AttackResult[]) => {
    setStreamed(results.map((_, i) => ({ state: "pending", key: i })));
    const stagger = Math.max(80, Math.min(380, Math.floor(2200 / results.length)));
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      setStreamed((cur) =>
        cur.map((s) =>
          s.key === i ? { state: "running", key: i, category: r.category, name: r.name } : s,
        ),
      );
      setProgressLabel(`Running ${r.name} (${i + 1}/${results.length})…`);
      // Smooth scroll to bottom
      requestAnimationFrame(() => {
        if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
      });
      await new Promise((res) => setTimeout(res, stagger));
      setStreamed((cur) =>
        cur.map((s) => (s.key === i ? { state: "done", key: i, result: r } : s)),
      );
    }
    setProgressLabel(`Complete · ${results.length} attacks executed`);
  }, []);

  const runOnAgent = useCallback(
    async (agent: Agent) => {
      setRunning({
        title: `Pen-testing · ${agent.name}`,
        sub: `Sending the full attack catalog against ${agent.name}. ${agent.vertical} agent, ${agent.model}.`,
      });
      setReport(null);
      setStreamed([]);
      setProgressLabel("Sending requests…");
      const d = await api<Report>("/api/redteam/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agent.id, max_attacks: 12 }),
      });
      if (!d) {
        setRunning(null);
        return;
      }
      await streamResults(d.results);
      setTimeout(() => {
        setRunning(null);
        setReport({ data: d, targetName: agent.name });
      }, 400);
    },
    [streamResults],
  );

  const runCustom = useCallback(async () => {
    if (!apiKey.trim()) return;
    setRunning({
      title: `Pen-testing · custom ${provider}/${model}`,
      sub: "Sending attacks against your external endpoint.",
    });
    setReport(null);
    setStreamed([]);
    setProgressLabel("Sending requests…");
    const d = await api<Report>("/api/redteam/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        api_key: apiKey,
        system_prompt: systemPrompt.trim() || null,
        max_attacks: 12,
      }),
    });
    if (!d) {
      setRunning(null);
      return;
    }
    await streamResults(d.results);
    setTimeout(() => {
      setRunning(null);
      setReport({ data: d, targetName: `${provider}/${model}` });
    }, 400);
  }, [provider, model, apiKey, systemPrompt, streamResults]);

  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">Automated pen-testing</div>
          <h1 className="arch-hero-title">
            Pick an agent · launch 30 attacks · get a resilience score
          </h1>
          <p className="arch-hero-sub">
            Click any agent below. SENTRY runs the OWASP LLM Top 10 attacks, classic jailbreaks
            (DAN, AIM, grandma), indirect injection, PII fishing, EU AI Act traps, DORA incident
            denial, and authority impersonation against it. Returns a 0–100 resilience score plus
            the exact prompts that broke through.
          </p>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card">
            <div className="metric-val">{catalogCount ?? "—"}</div>
            <div className="metric-lbl">Attacks in catalog</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">~120 s</div>
            <div className="metric-lbl">Typical run time</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">9</div>
            <div className="metric-lbl">Attack categories</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">0–100</div>
            <div className="metric-lbl">Resilience score</div>
          </div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Pick a target agent</h2>
          <p className="muted">
            Click any of the agents SENTRY is currently auditing. The pen test runs the full attack
            suite against the selected agent — no API keys required for the built-in demo agents.
          </p>
        </div>
        <div className="rt-agent-grid">
          {agents === null ? (
            <div className="muted" style={{ padding: 24, textAlign: "center" }}>
              Loading agents…
            </div>
          ) : agents.length === 0 ? (
            <div className="muted">Could not load agents.</div>
          ) : (
            agents.map((a) => (
              <AgentCard key={a.id} agent={a} onRun={() => runOnAgent(a)} />
            ))
          )}
        </div>

        <details
          className="rt-custom-fold"
          open={customOpen}
          onToggle={(e) => setCustomOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>⚙ Use a custom external agent instead (advanced)</summary>
          <form
            className="rt-form"
            onSubmit={(e) => {
              e.preventDefault();
              runCustom();
            }}
          >
            <div className="rt-grid">
              <label>
                <span>Provider</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </label>
              <label>
                <span>Model</span>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                />
              </label>
              <label className="full">
                <span>API key (not stored)</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…  or  sk-ant-…  or  AIza…"
                  autoComplete="off"
                />
              </label>
              <label className="full">
                <span>System prompt (optional)</span>
                <textarea
                  rows={2}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful customer-service agent for ACME Bank…"
                />
              </label>
            </div>
            <div className="rt-actions">
              <button type="submit" className="rt-run-btn">
                ⚡ Run pen test on custom agent
              </button>
            </div>
          </form>
        </details>
      </section>

      {running && (
        <section className="card arch-card rt-streaming-card">
          <div className="card-head">
            <h2>
              <Zap size={18} style={{ display: "inline-block", marginRight: 6, verticalAlign: "-3px", color: "var(--blue-500)" }} />
              {running.title}
            </h2>
            <p className="muted">{running.sub}</p>
          </div>
          <div className="rt-stream-progress">
            <div className="rt-stream-counter">
              <span className="rt-stream-done">
                {streamed.filter((s) => s.state === "done").length}
              </span>
              <span className="rt-stream-divider"> / </span>
              <span className="rt-stream-total">{streamed.length || "—"}</span>
              <span className="rt-stream-label">attacks executed</span>
            </div>
            <div className="rt-stream-stats">
              <span className="rt-stream-stat vulnerable">
                <ShieldX size={12} />{" "}
                {streamed.filter((s) => s.state === "done" && s.result.vulnerable).length} vulnerable
              </span>
              <span className="rt-stream-stat resisted">
                <Check size={12} />{" "}
                {streamed.filter((s) => s.state === "done" && !s.result.vulnerable).length} resisted
              </span>
            </div>
          </div>
          <div className="rt-stream" ref={streamRef}>
            {streamed.length === 0 ? (
              <div className="rt-stream-empty">{progressLabel}</div>
            ) : (
              streamed.map((s) => {
                if (s.state === "pending") {
                  return (
                    <div key={s.key} className="rt-stream-item pending">
                      <span className="rt-stream-dot" />
                      <span className="rt-stream-name muted">queued…</span>
                    </div>
                  );
                }
                if (s.state === "running") {
                  return (
                    <div key={s.key} className="rt-stream-item running">
                      <CircleDot size={14} className="rt-stream-icon spinning" />
                      <span className="rt-stream-cat">{s.category}</span>
                      <span className="rt-stream-name">{s.name}</span>
                      <span className="rt-stream-pill">in flight</span>
                    </div>
                  );
                }
                const r = s.result;
                return (
                  <div
                    key={s.key}
                    className={`rt-stream-item done ${r.vulnerable ? "vulnerable" : "resisted"}`}
                  >
                    {r.vulnerable ? (
                      <ShieldX size={14} className="rt-stream-icon" />
                    ) : (
                      <Check size={14} className="rt-stream-icon" />
                    )}
                    <span className="rt-stream-cat">{r.category}</span>
                    <span className="rt-stream-name">{r.name}</span>
                    <span className={`rt-stream-pill ${r.vulnerable ? "fail" : "ok"}`}>
                      {r.vulnerable ? "VULNERABLE" : "resisted"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {report && (
        <section className="card arch-card" ref={resultsRef}>
          <Results report={report.data} targetName={report.targetName} />
        </section>
      )}
    </div>
  );
}

function AgentCard({ agent, onRun }: { agent: Agent; onRun: () => void }) {
  return (
    <Link href={`/agent?id=${agent.id}`} className="rt-agent-card">
      <div className="rt-ag-head">
        <div className="rt-ag-icon">{agent.icon}</div>
        <div className="rt-ag-info">
          <div className="rt-ag-name">{agent.name}</div>
          <div className="rt-ag-vertical">{agent.vertical}</div>
        </div>
        <span className={`rt-ag-status ${agent.status === "active" ? "active" : ""}`}>
          {agent.status}
        </span>
      </div>
      <div className="rt-ag-desc">{agent.description}</div>
      <div className="rt-ag-tags">
        {(agent.regulations || []).map((r, i) => (
          <span key={i} className="rt-ag-tag">{r}</span>
        ))}
      </div>
      <div className="rt-ag-meta">
        <div className="rt-ag-meta-item">
          <div className="val">{agent.total_audits}</div>
          <div className="lbl">Audits</div>
        </div>
        <div className="rt-ag-meta-item">
          <div className="val warn">{agent.warnings_caught}</div>
          <div className="lbl">Warnings</div>
        </div>
        <div className="rt-ag-meta-item">
          <div className="val crit">{agent.criticals_caught}</div>
          <div className="lbl">Criticals</div>
        </div>
      </div>
      <button
        className="rt-ag-cta"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRun();
        }}
      >
        ⚡ Run pen test
      </button>
    </Link>
  );
}

function Results({ report, targetName }: { report: Report; targetName: string }) {
  const score = report.summary.resilience_score;
  const scoreCls = score < 60 ? "low" : score < 85 ? "mid" : "";
  const vul = report.summary.vulnerable;
  const total = report.summary.total;
  const summary = `Target: ${targetName}. ${vul}/${total} attacks succeeded. ${
    score >= 85
      ? "Strong resilience — minor gaps only."
      : score >= 60
        ? "Several gaps — review red rows below."
        : "Major gaps — urgent remediation needed."
  }`;

  const downloadPdf = async () => {
    const r = await fetch("/api/redteam/report.pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentry-redteam-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    const s = report.summary;
    const t = report.target;
    const text = `ARCA SENTRY · Red Team Report
Target: ${t.provider}/${t.model}
Date: ${report.completed_at}

Resilience score: ${s.resilience_score}%
Attacks executed: ${s.total}
Vulnerable: ${s.vulnerable}
Resisted: ${s.total - s.vulnerable}

By category:
${Object.entries(s.by_category)
  .map(([c, b]) => `  · ${c}: ${b.vulnerable}/${b.total} vulnerable`)
  .join("\n")}

Generated by ARCA SENTRY`;
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div className="card-head">
        <h2>Results</h2>
        <p className="muted">{summary}</p>
      </div>
      <div className="rt-score-band">
        <div className="rt-score">
          <div className={`rt-score-val ${scoreCls}`}>{score}%</div>
          <div className="rt-score-lbl">Resilience score</div>
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
          <div key={i} className={`rt-result ${r.vulnerable ? "vulnerable" : ""}`}>
            <div className="rt-result-head">
              <span className="cat-tag">{r.category}</span>
              <span className="name">{r.name}</span>
              <span className="verdict">{r.vulnerable ? "✗ VULNERABLE" : "✓ Resisted"}</span>
            </div>
            <div className="rt-result-body">
              {r.vulnerable ? (
                <>
                  <div className="rt-prompt-block">
                    <div className="rt-block-label">
                      <Target size={14} /> Attacker prompt
                    </div>
                    <code className="rt-prompt-code">{r.prompt || ""}</code>
                  </div>
                  <div className="rt-response-block">
                    <div className="rt-block-label">
                      <MessageSquare size={14} /> Bot response (leaked)
                    </div>
                    <code className="rt-response-code">
                      {(r.response || "").slice(0, 320)}
                      {(r.response || "").length > 320 ? "…" : ""}
                    </code>
                  </div>
                </>
              ) : (
                <div className="rt-prompt-block">
                  <div className="rt-block-label muted">Attempted prompt</div>
                  <code className="rt-prompt-code muted">
                    {(r.prompt || "").slice(0, 140)}
                    {(r.prompt || "").length > 140 ? "…" : ""}
                  </code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="rt-export-bar">
        <button type="button" className="rt-export-btn primary" onClick={downloadPdf}>
          📄 Download PDF report
        </button>
        <button type="button" className="rt-export-btn" onClick={copySummary}>
          📋 Copy summary to clipboard
        </button>
        <button
          type="button"
          className="rt-export-btn"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          🔗 Generate share link
        </button>
      </div>
    </>
  );
}
