"use client";

// ARCA SENTRY — Architecture page (Next.js port of architecture.html).
// Mostly static descriptive content. Marked "use client" purely so the page
// can consume the i18n context via useT(); there is no other interactivity.

import Topbar from "@/components/chrome/Topbar";
import { useT } from "@/lib/i18n";

interface InfoCard {
  key: string;
  titleKey: string;
  descKey: string;
  meta?: string;
}

// ── Flow stages ───────────────────────────────────────────────────────────
const FLOW_STAGES: ReadonlyArray<{
  num: number;
  titleKey: string;
  descKey: string;
}> = [
  { num: 1, titleKey: "arch.flow.s1.title", descKey: "arch.flow.s1.desc" },
  { num: 2, titleKey: "arch.flow.s2.title", descKey: "arch.flow.s2.desc" },
  { num: 3, titleKey: "arch.flow.s3.title", descKey: "arch.flow.s3.desc" },
  { num: 4, titleKey: "arch.flow.s4.title", descKey: "arch.flow.s4.desc" },
  { num: 5, titleKey: "arch.flow.s5.title", descKey: "arch.flow.s5.desc" },
  { num: 6, titleKey: "arch.flow.s6.title", descKey: "arch.flow.s6.desc" },
];

// ── The five auditor agents ───────────────────────────────────────────────
const AGENT_ROWS: ReadonlyArray<{
  badgeClass: string;
  badgeLabel: string;
  titleKey: string;
  sub: string;
  descKey: string;
  meta: string;
}> = [
  {
    badgeClass: "eu_ai_act",
    badgeLabel: "EU AI Act",
    titleKey: "arch.ag.euaiact.title",
    sub: "Art. 13 · 14 · 15 · 50",
    descKey: "arch.ag.euaiact.desc",
    meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless",
  },
  {
    badgeClass: "gdpr",
    badgeLabel: "GDPR",
    titleKey: "arch.ag.gdpr.title",
    sub: "Art. 5 · 13 · 14 · 15 · 17 · 22",
    descKey: "arch.ag.gdpr.desc",
    meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless",
  },
  {
    badgeClass: "dora",
    badgeLabel: "DORA",
    titleKey: "arch.ag.dora.title",
    sub: "Art. 17–23 · 28–44",
    descKey: "arch.ag.dora.desc",
    meta: "Powered by <code>deepseek-ai/DeepSeek-V3.1</code> via Featherless",
  },
  {
    badgeClass: "pii_leak",
    badgeLabel: "PII Leak",
    titleKey: "arch.ag.pii.title",
    sub: "GDPR Art. 5/32 · ISO 27001",
    descKey: "arch.ag.pii.desc",
    meta: "Regex layer + <code>Qwen/Qwen2.5-14B-Instruct</code>",
  },
  {
    badgeClass: "prompt_injection",
    badgeLabel: "Prompt Injection",
    titleKey: "arch.ag.pi.title",
    sub: "OWASP LLM Top 10",
    descKey: "arch.ag.pi.desc",
    meta: "Powered by <code>moonshotai/Kimi-K2-Instruct-0905</code> via Featherless",
  },
];

// ── Severity cards ────────────────────────────────────────────────────────
const SEV_CARDS: ReadonlyArray<{
  level: "advisory" | "warning" | "critical";
  label: string;
  actionKey: string;
  trigger: string | null;
  descKey: string;
}> = [
  {
    level: "advisory",
    label: "ADVISORY",
    actionKey: "arch.sev.adv.action",
    trigger: "≥ 1 agent at conf ≥ 0.50",
    descKey: "arch.sev.adv.desc",
  },
  {
    level: "warning",
    label: "WARNING",
    actionKey: "arch.sev.warn.action",
    trigger: "≥ 1 agent at conf ≥ 0.70",
    descKey: "arch.sev.warn.desc",
  },
  {
    level: "critical",
    label: "CRITICAL",
    actionKey: "arch.sev.crit.action",
    trigger: null, // rendered inline (multi-line w/ <span class="or">)
    descKey: "arch.sev.crit.desc",
  },
];

const INTEGRITY_CARDS: ReadonlyArray<InfoCard> = [
  { key: "chain", titleKey: "arch.int.chain.title", descKey: "arch.int.chain.desc" },
  { key: "append", titleKey: "arch.int.append.title", descKey: "arch.int.append.desc" },
  { key: "verify", titleKey: "arch.int.verify.title", descKey: "arch.int.verify.desc" },
  { key: "pg", titleKey: "arch.int.pg.title", descKey: "arch.int.pg.desc" },
];

const SEC_CARDS: ReadonlyArray<InfoCard> = [
  { key: "secrets", titleKey: "arch.sec.secrets.title", descKey: "arch.sec.secrets.desc" },
  { key: "injection", titleKey: "arch.sec.injection.title", descKey: "arch.sec.injection.desc" },
  { key: "auditable", titleKey: "arch.sec.auditable.title", descKey: "arch.sec.auditable.desc" },
  {
    key: "reversible",
    titleKey: "arch.sec.reversible.title",
    descKey: "arch.sec.reversible.desc",
  },
];

const STACK_CARDS: ReadonlyArray<{ titleKey: string; items: string[] }> = [
  {
    titleKey: "arch.stack.inf",
    items: [
      "<strong>Gemini 2.5 Pro</strong> — synthesizer + suggestions",
      "<strong>Featherless</strong> — 5 specialized agents",
      "<strong>Speechmatics</strong> — real-time STT + diarization",
    ],
  },
  {
    titleKey: "arch.stack.run",
    items: [
      "<strong>Python 3.11+</strong> — asyncio native",
      "<strong>FastAPI + Uvicorn</strong> — API layer",
      "<strong>aiosqlite</strong> — event store",
      "<strong>httpx + websockets</strong> — I/O",
    ],
  },
  {
    titleKey: "arch.stack.persist",
    items: [
      "<strong>SQLite WAL</strong> — local event store",
      "<strong>PostgreSQL</strong> — enterprise alt.",
      "<strong>JSON payloads</strong> — schema-free events",
      "<strong>SHA-256 chain</strong> — tamper-evident",
    ],
  },
  {
    titleKey: "arch.stack.deploy",
    items: [
      "<strong>Docker Compose</strong> — local dev",
      "<strong>systemd</strong> — Linux servers (Vultr)",
      "<strong>NVIDIA Grace ARM64</strong> — production validated",
      "<strong>nginx + TLS</strong> — reverse proxy",
    ],
  },
  {
    titleKey: "arch.stack.front",
    items: [
      "<strong>Next.js 16 + React 19</strong> — App Router",
      "<strong>Tailwind CSS v4</strong> — styling",
      "<strong>Chart.js</strong> — data viz",
      "<strong>Web Speech API</strong> — voice I/O",
    ],
  },
  {
    titleKey: "arch.stack.qa",
    items: [
      "<strong>pytest + asyncio</strong> — 14 tests",
      "<strong>ruff</strong> — linting",
      "<strong>mypy</strong> — type checking",
      "<strong>3,690 LOC</strong> — clean, segmented",
    ],
  },
];

const PERF_CARDS: ReadonlyArray<{
  val: string;
  lblKey: string;
  noteKey: string;
}> = [
  { val: "~50 ms", lblKey: "arch.perf.p1.lbl", noteKey: "arch.perf.p1.note" },
  { val: "2–4 s", lblKey: "arch.perf.p2.lbl", noteKey: "arch.perf.p2.note" },
  { val: "3–6 s", lblKey: "arch.perf.p3.lbl", noteKey: "arch.perf.p3.note" },
  { val: "~50 req/s", lblKey: "arch.perf.p4.lbl", noteKey: "arch.perf.p4.note" },
  { val: "< 2%", lblKey: "arch.perf.p5.lbl", noteKey: "arch.perf.p5.note" },
  { val: "1 MB / 10K events", lblKey: "arch.perf.p6.lbl", noteKey: "arch.perf.p6.note" },
];

const TOPO_CARDS: ReadonlyArray<{
  tierKey: string;
  spec: string;
  bullets: string[];
}> = [
  {
    tierKey: "arch.topo.smb.tier",
    spec: "1× Vultr Cloud Compute · 1 vCPU · 1 GB RAM · Ubuntu 22.04",
    bullets: ["SQLite event store", "systemd units", "~5 req/s sustained", "$6/mo"],
  },
  {
    tierKey: "arch.topo.mid.tier",
    spec: "3× Vultr Cloud Compute · 2 vCPU · 4 GB RAM · nginx LB",
    bullets: [
      "PostgreSQL primary + replica",
      "Redis for queues",
      "~50 req/s sustained",
      "$80/mo",
    ],
  },
  {
    tierKey: "arch.topo.ent.tier",
    spec: "Kubernetes · 6+ pods per service · regional HA",
    bullets: ["PostgreSQL HA cluster", "SIEM integration", "Vault for secrets", "500+ req/s"],
  },
];

export default function ArchitecturePage() {
  const { t } = useT();

  return (
    <>
      <Topbar pageKey="architecture" />

      <main className="arch-main">
        {/* HERO */}
        <section className="arch-hero">
          <div className="arch-hero-text">
            <div className="pg-hero-eyebrow">{t("arch.hero.eyebrow")}</div>
            <h1 className="arch-hero-title">{t("arch.hero.title")}</h1>
            <p className="arch-hero-sub">{t("arch.hero.sub")}</p>
          </div>
          <div className="arch-hero-metrics">
            <div className="metric-card">
              <div className="metric-val">&lt; 6s</div>
              <div className="metric-lbl">{t("arch.metric.latency")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">5</div>
              <div className="metric-lbl">{t("arch.metric.agents")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">100%</div>
              <div className="metric-lbl">{t("arch.metric.integrity")}</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">5</div>
              <div className="metric-lbl">{t("arch.metric.langs")}</div>
            </div>
          </div>
        </section>

        {/* FLOW DIAGRAM */}
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
                  <div
                    className="flow-desc"
                    dangerouslySetInnerHTML={{ __html: t(s.descKey) }}
                  />
                </div>
                {i < FLOW_STAGES.length - 1 && (
                  <div className="flow-arrow" aria-hidden="true">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* THE FIVE AGENTS */}
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
                  <div
                    className="agent-detail-desc"
                    dangerouslySetInnerHTML={{ __html: t(row.descKey) }}
                  />
                  <div
                    className="agent-detail-meta"
                    dangerouslySetInnerHTML={{ __html: row.meta }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEVERITY MODEL */}
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

        {/* INTEGRITY */}
        <section className="card arch-card">
          <div className="card-head">
            <h2>{t("arch.integrity.title")}</h2>
            <p className="muted">{t("arch.integrity.desc")}</p>
          </div>
          <div className="integrity-grid">
            {INTEGRITY_CARDS.map((c) => (
              <div key={c.key} className="integrity-card">
                <div className="integrity-title">{t(c.titleKey)}</div>
                <div
                  className="integrity-desc"
                  dangerouslySetInnerHTML={{ __html: t(c.descKey) }}
                />
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

        {/* TECH STACK */}
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
                    <li
                      key={i}
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE */}
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

        {/* SECURITY */}
        <section className="card arch-card">
          <div className="card-head">
            <h2>{t("arch.sec.title")}</h2>
            <p className="muted">{t("arch.sec.desc")}</p>
          </div>
          <div className="sec-grid">
            {SEC_CARDS.map((c) => (
              <div key={c.key} className="sec-card">
                <div className="sec-title">{t(c.titleKey)}</div>
                <div
                  className="sec-desc"
                  dangerouslySetInnerHTML={{ __html: t(c.descKey) }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* DEPLOYMENT TOPOLOGIES */}
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
                  {c.bullets.map((b) => (
                    <span key={b}>{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
