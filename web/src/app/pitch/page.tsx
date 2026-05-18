"use client";

import { useMemo, useState, useEffect } from "react";
import Topbar from "@/components/chrome/Topbar";
import { useT } from "@/lib/i18n";

type TabKey = "how" | "architecture" | "proxy";

export default function PitchPage() {
  const [tab, setTab] = useState<TabKey>("how");

  return (
    <>
      <Topbar pageKey="pitch" />

      <main className="arch-main">
        <div className="pitch-head">
          <h1>How ARCA SENTRY works</h1>
          <p className="muted">
            All the conceptual + technical material in one place. Use this for demos and walkthroughs.
          </p>
        </div>

        <div className="snippet-tabs pitch-tabs">
          <button
            type="button"
            className={`snippet-tab ${tab === "how" ? "active" : ""}`}
            onClick={() => setTab("how")}
          >
            How it works
          </button>
          <button
            type="button"
            className={`snippet-tab ${tab === "architecture" ? "active" : ""}`}
            onClick={() => setTab("architecture")}
          >
            Architecture
          </button>
          <button
            type="button"
            className={`snippet-tab ${tab === "proxy" ? "active" : ""}`}
            onClick={() => setTab("proxy")}
          >
            Proxy &amp; SDKs
          </button>
        </div>

        {tab === "how" && <HowItWorks />}
        {tab === "architecture" && <Architecture />}
        {tab === "proxy" && <Proxy />}
      </main>

      <footer className="footer">
        © ARCA SENTRY
      </footer>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HOW IT WORKS — consolidates the feature heroes
// ══════════════════════════════════════════════════════════════════════════
function HowItWorks() {
  return (
    <>
      <section className="card arch-card">
        <div className="card-head">
          <h2>Connect any agent</h2>
          <p className="muted">
            Onboarding takes ~30 seconds. SENTRY supports drop-in proxy mode (OpenAI / Anthropic / Gemini SDKs), raw HTTP endpoint testing, web chat-widget scanning, and (soon) WhatsApp + Facebook Messenger.
          </p>
        </div>
        <div className="arch-hero-metrics" style={{ minWidth: 0 }}>
          <div className="metric-card"><div className="metric-val">5</div><div className="metric-lbl">Channels</div></div>
          <div className="metric-card"><div className="metric-val">~30 s</div><div className="metric-lbl">Time to register</div></div>
          <div className="metric-card"><div className="metric-val">12+</div><div className="metric-lbl">Attacks ready to fire</div></div>
          <div className="metric-card"><div className="metric-val">5</div><div className="metric-lbl">Regulations covered</div></div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Proxy mode · 1 line of code</h2>
          <p className="muted">
            Point your OpenAI / Anthropic / Gemini client at SENTRY&apos;s URL instead of the upstream provider. Every call is audited in flight. Critical violations are blocked at the gateway with HTTP 451; warnings pass through with diagnostic headers. See the <strong>Proxy &amp; SDKs</strong> tab for code snippets.
          </p>
        </div>
        <div className="arch-hero-metrics" style={{ minWidth: 0 }}>
          <div className="metric-card"><div className="metric-val">3</div><div className="metric-lbl">Provider APIs supported</div></div>
          <div className="metric-card"><div className="metric-val">1 line</div><div className="metric-lbl">Code changes required</div></div>
          <div className="metric-card"><div className="metric-val">HTTP 451</div><div className="metric-lbl">On compliance block</div></div>
          <div className="metric-card"><div className="metric-val">6 headers</div><div className="metric-lbl">Added per response</div></div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Auto-Fix · don&apos;t block the user, rewrite the response</h2>
          <p className="muted">
            When the audit detects a violation, SENTRY can ask Gemini Pro to <strong>rewrite</strong> the response so the end user receives a compliant reply instead of an error. The original AND the rewrite are both stored — your compliance team reviews the diff, not a customer complaint.
          </p>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Red Team · automated pen-testing</h2>
          <p className="muted">
            Run the attack suite against any registered agent. 12+ pre-built attacks across the 5 regulation families — credit-decision opacity, GDPR right-to-explanation, DORA incident hiding, PII probes, prompt-injection chains. Output: pass/fail score, breakdown, downloadable PDF report.
          </p>
        </div>
      </section>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ARCHITECTURE
// ══════════════════════════════════════════════════════════════════════════
const FLOW_STAGES: ReadonlyArray<{ num: number; titleKey: string; descKey: string }> = [
  { num: 1, titleKey: "arch.flow.s1.title", descKey: "arch.flow.s1.desc" },
  { num: 2, titleKey: "arch.flow.s2.title", descKey: "arch.flow.s2.desc" },
  { num: 3, titleKey: "arch.flow.s3.title", descKey: "arch.flow.s3.desc" },
  { num: 4, titleKey: "arch.flow.s4.title", descKey: "arch.flow.s4.desc" },
  { num: 5, titleKey: "arch.flow.s5.title", descKey: "arch.flow.s5.desc" },
  { num: 6, titleKey: "arch.flow.s6.title", descKey: "arch.flow.s6.desc" },
];

const AGENT_ROWS = [
  { badgeClass: "eu_ai_act", badgeLabel: "EU AI Act", titleKey: "arch.ag.euaiact.title", sub: "Art. 13 · 14 · 15 · 50", descKey: "arch.ag.euaiact.desc", meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless" },
  { badgeClass: "gdpr", badgeLabel: "GDPR", titleKey: "arch.ag.gdpr.title", sub: "Art. 5 · 13 · 14 · 15 · 17 · 22", descKey: "arch.ag.gdpr.desc", meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless" },
  { badgeClass: "dora", badgeLabel: "DORA", titleKey: "arch.ag.dora.title", sub: "Art. 17–23 · 28–44", descKey: "arch.ag.dora.desc", meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless" },
  { badgeClass: "pii_leak", badgeLabel: "PII Leak", titleKey: "arch.ag.pii.title", sub: "GDPR Art. 5/32 · ISO 27001", descKey: "arch.ag.pii.desc", meta: "Regex layer + <code>Qwen/Qwen2.5-14B-Instruct</code>" },
  { badgeClass: "prompt_injection", badgeLabel: "Prompt Injection", titleKey: "arch.ag.pi.title", sub: "OWASP LLM Top 10", descKey: "arch.ag.pi.desc", meta: "Powered by <code>moonshotai/Kimi-K2-Instruct-0905</code> via Featherless" },
] as const;

const SEV_CARDS = [
  { level: "advisory", label: "ADVISORY", actionKey: "arch.sev.adv.action", trigger: "≥ 1 agent at conf ≥ 0.50", descKey: "arch.sev.adv.desc" },
  { level: "warning", label: "WARNING", actionKey: "arch.sev.warn.action", trigger: "≥ 1 agent at conf ≥ 0.70", descKey: "arch.sev.warn.desc" },
  { level: "critical", label: "CRITICAL", actionKey: "arch.sev.crit.action", trigger: null, descKey: "arch.sev.crit.desc" },
] as const;

const INTEGRITY_CARDS = [
  { key: "chain", titleKey: "arch.int.chain.title", descKey: "arch.int.chain.desc" },
  { key: "append", titleKey: "arch.int.append.title", descKey: "arch.int.append.desc" },
  { key: "verify", titleKey: "arch.int.verify.title", descKey: "arch.int.verify.desc" },
  { key: "pg", titleKey: "arch.int.pg.title", descKey: "arch.int.pg.desc" },
];

const SEC_CARDS = [
  { key: "secrets", titleKey: "arch.sec.secrets.title", descKey: "arch.sec.secrets.desc" },
  { key: "injection", titleKey: "arch.sec.injection.title", descKey: "arch.sec.injection.desc" },
  { key: "auditable", titleKey: "arch.sec.auditable.title", descKey: "arch.sec.auditable.desc" },
  { key: "reversible", titleKey: "arch.sec.reversible.title", descKey: "arch.sec.reversible.desc" },
];

const STACK_CARDS = [
  { titleKey: "arch.stack.inf", items: ["<strong>Gemini 2.5 Pro</strong> — synthesizer + suggestions", "<strong>Featherless</strong> — 5 specialized agents", "<strong>Speechmatics</strong> — real-time STT + diarization"] },
  { titleKey: "arch.stack.run", items: ["<strong>Python 3.11+</strong> — asyncio native", "<strong>FastAPI + Uvicorn</strong> — API layer", "<strong>aiosqlite</strong> — event store", "<strong>httpx + websockets</strong> — I/O"] },
  { titleKey: "arch.stack.persist", items: ["<strong>SQLite WAL</strong> — local event store", "<strong>PostgreSQL</strong> — enterprise alt.", "<strong>JSON payloads</strong> — schema-free events", "<strong>SHA-256 chain</strong> — tamper-evident"] },
  { titleKey: "arch.stack.deploy", items: ["<strong>Docker Compose</strong> — local dev", "<strong>systemd</strong> — Linux servers (Vultr)", "<strong>NVIDIA Grace ARM64</strong> — production validated", "<strong>nginx + TLS</strong> — reverse proxy"] },
  { titleKey: "arch.stack.front", items: ["<strong>Next.js 16 + React 19</strong> — App Router", "<strong>Tailwind CSS v4</strong> — styling", "<strong>Chart.js</strong> — data viz", "<strong>Web Speech API</strong> — voice I/O"] },
  { titleKey: "arch.stack.qa", items: ["<strong>pytest + asyncio</strong> — 14 tests", "<strong>ruff</strong> — linting", "<strong>mypy</strong> — type checking", "<strong>3,690 LOC</strong> — clean, segmented"] },
];

const PERF_CARDS = [
  { val: "~50 ms", lblKey: "arch.perf.p1.lbl", noteKey: "arch.perf.p1.note" },
  { val: "2–4 s", lblKey: "arch.perf.p2.lbl", noteKey: "arch.perf.p2.note" },
  { val: "3–6 s", lblKey: "arch.perf.p3.lbl", noteKey: "arch.perf.p3.note" },
  { val: "~50 req/s", lblKey: "arch.perf.p4.lbl", noteKey: "arch.perf.p4.note" },
  { val: "< 2%", lblKey: "arch.perf.p5.lbl", noteKey: "arch.perf.p5.note" },
  { val: "1 MB / 10K events", lblKey: "arch.perf.p6.lbl", noteKey: "arch.perf.p6.note" },
];

const TOPO_CARDS = [
  { tierKey: "arch.topo.smb.tier", spec: "1× Vultr Cloud Compute · 1 vCPU · 1 GB RAM · Ubuntu 22.04", bullets: ["SQLite event store", "systemd units", "~5 req/s sustained", "$6/mo"] },
  { tierKey: "arch.topo.mid.tier", spec: "3× Vultr Cloud Compute · 2 vCPU · 4 GB RAM · nginx LB", bullets: ["PostgreSQL primary + replica", "Redis for queues", "~50 req/s sustained", "$80/mo"] },
  { tierKey: "arch.topo.ent.tier", spec: "Kubernetes · 6+ pods per service · regional HA", bullets: ["PostgreSQL HA cluster", "SIEM integration", "Vault for secrets", "500+ req/s"] },
];

function Architecture() {
  const { t } = useT();
  return (
    <>
      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.flow.title")}</h2>
          <p className="muted">{t("arch.flow.desc")}</p>
        </div>
        <div className="flow-diagram">
          {FLOW_STAGES.map((s, i) => (
            <div key={s.num} style={{ display: "contents" }}>
              <div className="flow-stage">
                <div className="flow-num">{s.num}</div>
                <div className="flow-title">{t(s.titleKey)}</div>
                <div className="flow-desc" dangerouslySetInnerHTML={{ __html: t(s.descKey) }} />
              </div>
              {i < FLOW_STAGES.length - 1 && <div className="flow-arrow" aria-hidden="true">→</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.agents.title")}</h2>
          <p className="muted">{t("arch.agents.desc")}</p>
        </div>
        <div className="agents-table">
          {AGENT_ROWS.map((row) => (
            <div key={row.badgeClass} className="agent-row">
              <div className={`agent-badge ${row.badgeClass}`}>{row.badgeLabel}</div>
              <div className="agent-detail">
                <div className="agent-detail-title">{t(row.titleKey)}</div>
                <div className="agent-detail-sub">{row.sub}</div>
                <div className="agent-detail-desc" dangerouslySetInnerHTML={{ __html: t(row.descKey) }} />
                <div className="agent-detail-meta" dangerouslySetInnerHTML={{ __html: row.meta }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.severity.title")}</h2>
          <p className="muted">{t("arch.severity.desc")}</p>
        </div>
        <div className="severity-grid">
          {SEV_CARDS.map((c) => (
            <div key={c.level} className={`sev-card ${c.level}`}>
              <div className="sev-card-head">
                <span className={`sev-pill ${c.level}`}>{c.label}</span>
                <span className="sev-card-action">{t(c.actionKey)}</span>
              </div>
              <div className="sev-card-trigger">
                {c.trigger ?? (
                  <>
                    ≥ 2 agents at conf ≥ 0.85, <span className="or">or</span>
                    <br />≥ 1 agent at conf ≥ 0.95, <span className="or">or</span>
                    <br />prompt_injection + pii_leak together, <span className="or">or</span>
                    <br />≥ 3 distinct regulations flagged
                  </>
                )}
              </div>
              <div className="sev-card-desc">{t(c.descKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.integrity.title")}</h2>
          <p className="muted">{t("arch.integrity.desc")}</p>
        </div>
        <div className="integrity-grid">
          {INTEGRITY_CARDS.map((c) => (
            <div key={c.key} className="integrity-card">
              <div className="integrity-title">{t(c.titleKey)}</div>
              <div className="integrity-desc" dangerouslySetInnerHTML={{ __html: t(c.descKey) }} />
              {c.key === "chain" && (
                <pre className="integrity-snippet">{`self_hash = SHA256(
    prev_hash + created_at +
    event_type + payload_json
)`}</pre>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.stack.title")}</h2>
          <p className="muted">{t("arch.stack.desc")}</p>
        </div>
        <div className="stack-grid">
          {STACK_CARDS.map((c) => (
            <div key={c.titleKey} className="stack-card">
              <div className="stack-cat">{t(c.titleKey)}</div>
              <ul>
                {c.items.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.perf.title")}</h2>
          <p className="muted">{t("arch.perf.desc")}</p>
        </div>
        <div className="perf-grid">
          {PERF_CARDS.map((c) => (
            <div key={c.lblKey} className="perf-card">
              <div className="perf-val">{c.val}</div>
              <div className="perf-lbl">{t(c.lblKey)}</div>
              <div className="perf-note">{t(c.noteKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.sec.title")}</h2>
          <p className="muted">{t("arch.sec.desc")}</p>
        </div>
        <div className="sec-grid">
          {SEC_CARDS.map((c) => (
            <div key={c.key} className="sec-card">
              <div className="sec-title">{t(c.titleKey)}</div>
              <div className="sec-desc" dangerouslySetInnerHTML={{ __html: t(c.descKey) }} />
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>{t("arch.topo.title")}</h2>
          <p className="muted">{t("arch.topo.desc")}</p>
        </div>
        <div className="topo-grid">
          {TOPO_CARDS.map((c) => (
            <div key={c.tierKey} className="topo-card">
              <div className="topo-tier">{t(c.tierKey)}</div>
              <div className="topo-spec">{c.spec}</div>
              <div className="topo-bullets">
                {c.bullets.map((b) => <span key={b}>{b}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROXY & SDKs
// ══════════════════════════════════════════════════════════════════════════
type SnippetKey = "openai" | "openai-node" | "anthropic" | "gemini" | "langchain";

function Proxy() {
  const [pane, setPane] = useState<SnippetKey>("openai");
  const [origin, setOrigin] = useState("https://sentry.example.com");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const baseV1 = `${origin}/v1`;
  const base = origin;

  const snippets: Record<SnippetKey, string> = useMemo(() => ({
    "openai": `# Before
from openai import OpenAI
client = OpenAI(api_key="sk-...")

# After — only base_url changed
client = OpenAI(
    api_key="sk-...",
    base_url="${baseV1}",
)

# The rest of your code stays IDENTICAL
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Why was my loan denied?"}],
)`,
    "openai-node": `// Before
import OpenAI from "openai";
const client = new OpenAI({ apiKey: "sk-..." });

// After
const client = new OpenAI({
  apiKey: "sk-...",
  baseURL: "${baseV1}",
});`,
    "anthropic": `# Before
import anthropic
client = anthropic.Anthropic(api_key="sk-ant-...")

# After
client = anthropic.Anthropic(
    api_key="sk-ant-...",
    base_url="${base}",
)`,
    "gemini": `curl -X POST \\
  "${base}/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "contents": [{"parts": [{"text": "Why was my loan denied?"}]}] }'`,
    "langchain": `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key="sk-...",
    base_url="${baseV1}",
)`,
  }), [baseV1, base]);

  return (
    <>
      <section className="card arch-card">
        <div className="card-head">
          <h2>Pick your provider — copy, paste, ship</h2>
          <p className="muted">Every snippet below works against your existing code. Just change <code>base_url</code> (OpenAI) / SDK URL (Anthropic) / endpoint URL (Gemini).</p>
        </div>
        <div className="snippet-tabs">
          {([
            ["openai", "OpenAI · Python"],
            ["openai-node", "OpenAI · Node"],
            ["anthropic", "Anthropic · Python"],
            ["gemini", "Gemini · curl"],
            ["langchain", "LangChain"],
          ] as Array<[SnippetKey, string]>).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`snippet-tab ${pane === k ? "active" : ""}`}
              onClick={() => setPane(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <pre><code>{snippets[pane]}</code></pre>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>What you get in every response</h2>
          <p className="muted">Headers added by SENTRY on every proxied response, so your application can react to the verdict programmatically.</p>
        </div>
        <table className="headers-table">
          <tbody>
            <tr><th>Header</th><th>Values</th><th>Meaning</th></tr>
            <tr><td><code>X-Sentry-Severity</code></td><td>advisory · warning · critical</td><td>Verdict from the audit. Critical never reaches here — it returns 451 instead.</td></tr>
            <tr><td><code>X-Sentry-Action</code></td><td>allow · warn · block</td><td>Action SENTRY took.</td></tr>
            <tr><td><code>X-Sentry-Interaction-Id</code></td><td>UUID</td><td>Use to look up the full audit record via <code>/reports/{`{id}`}.json</code>.</td></tr>
            <tr><td><code>X-Sentry-Finding-Count</code></td><td>0, 1, 2…</td><td>How many auditors flagged something.</td></tr>
            <tr><td><code>X-Sentry-Primary-Regulation</code></td><td>eu_ai_act · gdpr · dora · pii_leak · prompt_injection</td><td>Top-priority regulation flagged.</td></tr>
            <tr><td><code>X-Sentry-Primary-Article</code></td><td>Article number string</td><td>The specific article being violated.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>What happens on a CRITICAL violation</h2>
          <p className="muted">SENTRY returns HTTP 451 (Unavailable for Legal Reasons) instead of forwarding the upstream response. The body matches the shape your SDK expects, so your existing error-handling path catches it.</p>
        </div>
        <pre><code>{`HTTP/1.1 451 Unavailable For Legal Reasons
X-Sentry-Severity: critical
X-Sentry-Action: block
X-Sentry-Primary-Regulation: prompt_injection
X-Sentry-Primary-Article: Prompt Injection (OWASP LLM01)
Content-Type: application/json

{
  "error": {
    "message": "Response blocked by SENTRY · Prompt Injection · The AI verbatim disclosed both its system prompt and an API key…",
    "type": "compliance_block",
    "code": "blocked_by_sentry"
  }
}`}</code></pre>
      </section>
    </>
  );
}
