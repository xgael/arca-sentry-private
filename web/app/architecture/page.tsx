"use client";

import { useState } from "react";
import {
  ArrowRight,
  Ban,
  Cpu,
  Database,
  FileCheck,
  Globe,
  Key,
  Link as LinkIcon,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import "../playground/playground.css";
import "./architecture.css";

type StageDetail = {
  endpoint: string;
  request?: string;
  response?: string;
  files?: string[];
  notes?: string;
};

type Stage = {
  num: number;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: React.ReactNode;
  detail: StageDetail;
};

const FLOW: Stage[] = [
  {
    num: 1,
    Icon: Globe,
    title: "Capture",
    desc: (
      <>
        Production AI sends every interaction to <code>POST /audit</code>. Voice calls stream through
        Speechmatics with speaker diarization.
      </>
    ),
    detail: {
      endpoint: "POST /api/audit",
      request: `{
  "channel": "text",
  "actor": "loan-bot-prod",
  "request": "Why was my loan denied?",
  "response": "Your application was automatically denied. We can't share details.",
  "lang": "en"
}`,
      response: `{
  "interaction_id": "4f2a-019",
  "queued": true
}`,
      files: ["api/routes/audit.py", "capture/intake.py"],
      notes: "Synchronous handshake (~5ms). The actual audit runs async in the orchestrator.",
    },
  },
  {
    num: 2,
    Icon: Cpu,
    title: "Orchestrator",
    desc: (
      <>
        Builds an <code>Interaction</code> and fans out to all five auditor agents simultaneously via{" "}
        <code>asyncio.gather</code>.
      </>
    ),
    detail: {
      endpoint: "core.orchestrator.run_audit(interaction)",
      request: "Interaction { id, channel, request, response, actor, lang, metadata }",
      response: "list[Finding]  (5 in parallel)",
      files: ["core/orchestrator.py", "core/interaction.py"],
      notes: "Per-model semaphore prevents 429 cascades. Each agent ~600ms; total ~800ms wall time.",
    },
  },
  {
    num: 3,
    Icon: Users,
    title: "Auditor council",
    desc: (
      <>
        Five domain-specialized models inspect the exchange in parallel. Each returns a{" "}
        <code>Finding</code> with confidence 0.0–1.0.
      </>
    ),
    detail: {
      endpoint: "agents/{eu_ai_act,gdpr,dora,pii_leak,prompt_injection}.audit()",
      request: "Interaction",
      response: `Finding {
  agent: "eu_ai_act_auditor",
  regulation: "eu_ai_act",
  article: "Art. 13",
  confidence: 0.92,
  rationale: "Automated credit decision lacks explanation path…"
}`,
      files: ["agents/base.py", "agents/eu_ai_act.py", "agents/gdpr.py", "agents/dora.py", "agents/pii_leak.py", "agents/prompt_injection.py"],
      notes: "Each agent runs regex pre-filter first; LLM is only invoked if signal exists.",
    },
  },
  {
    num: 4,
    Icon: Scale,
    title: "Severity engine",
    desc: (
      <>
        Findings are classified into <span className="sev-pill advisory">advisory</span>{" "}
        <span className="sev-pill warning">warning</span>{" "}
        <span className="sev-pill critical">critical</span>. Consensus rule blocks single-agent false
        positives.
      </>
    ),
    detail: {
      endpoint: "core.severity.classify(findings)",
      request: "list[Finding]",
      response: `Decision {
  severity: "critical" | "warning" | "advisory",
  action: "block" | "warn" | "allow",
  primary_regulation: "eu_ai_act"
}`,
      files: ["core/severity.py"],
      notes: "Rules: ≥2 agents ≥0.85, OR ≥1 agent ≥0.95, OR prompt_injection+pii_leak, OR ≥3 regs.",
    },
  },
  {
    num: 5,
    Icon: Sparkles,
    title: "Synthesizer",
    desc: (
      <>
        Gemini 2.5 Pro composes the auditable report in the source language. Includes article
        citations and recommended action.
      </>
    ),
    detail: {
      endpoint: "synthesizer.compose(interaction, findings, decision)",
      request: "Interaction + list[Finding] + Decision",
      response: `Report {
  summary: "Bot refused credit decision without offering…",
  long_report: "## EU AI Act Compliance Audit\\n\\n…",
  recommended_action: "Add Art. 13-compliant explanation…",
  lang: "en"
}`,
      files: ["synthesizer/gemini.py", "synthesizer/templates.py"],
      notes: "Only fires when findings exist. ~2-3s p95. Skipped on clean interactions.",
    },
  },
  {
    num: 6,
    Icon: Shield,
    title: "Persist & act",
    desc: (
      <>
        Every event appends to the SHA-256-chained event store. Tickets auto-open with cost estimate.
        Critical responses block at the gateway.
      </>
    ),
    detail: {
      endpoint: "db.event_store.append(event) → SHA-256 chained",
      request: "Event { type, interaction_id, payload, prev_hash }",
      response: "Event { ..., self_hash: 'a3f8…' }",
      files: ["db/event_store.py", "db/tickets.py", "deploy/gateway.py"],
      notes: "On critical: gateway returns HTTP 451. Ticket auto-opens with exposure estimate.",
    },
  },
];

const AGENTS = [
  {
    key: "eu_ai_act",
    label: "EU AI Act",
    title: "Transparency, oversight & disclosure",
    sub: "Art. 13 · 14 · 15 · 50",
    desc: "Flags automated consequential decisions (credit, hiring, eligibility) lacking explanation or human-review path. Also fires when a voice agent denies being an AI under Art. 50.",
    meta: "deepseek-ai/DeepSeek-V3.1 via Featherless",
  },
  {
    key: "gdpr",
    label: "GDPR",
    title: "Data subject rights",
    sub: "Art. 5 · 13 · 14 · 15 · 17 · 22",
    desc: "Detects unlawful processing, opaque automated decisions, refused access requests, and erasure denials. Cross-checks with PII Leak for compound breaches.",
    meta: "deepseek-ai/DeepSeek-V3.1 via Featherless",
  },
  {
    key: "dora",
    label: "DORA",
    title: "Digital operational resilience",
    sub: "Art. 17–23 · 28–44",
    desc: "Catches incidents being denied, hidden third-party dependencies, opaque trading advice, and missing incident-reporting channels. Specific to EU financial entities post-Jan 2025.",
    meta: "deepseek-ai/DeepSeek-V3.1 via Featherless",
  },
  {
    key: "pii_leak",
    label: "PII Leak",
    title: "Volunteered personal data",
    sub: "GDPR Art. 5/32 · ISO 27001",
    desc: "Deterministic regex bank: email, IBAN, credit card, codice fiscale, CURP, RFC, SSN, passport, DNI, phone. LLM confirms whether the leak was solicited (legitimate retrieval) or volunteered (breach pattern).",
    meta: "Regex layer + Qwen/Qwen2.5-14B-Instruct",
  },
  {
    key: "prompt_injection",
    label: "Prompt Injection",
    title: "OWASP LLM01 — direct + indirect injection",
    sub: "OWASP LLM Top 10",
    desc: "Two-stage detection: attack-side markers in the user request and compliance-side regex in the AI response (leaked system prompts, leaked credentials, broken character).",
    meta: "moonshotai/Kimi-K2-Instruct-0905 via Featherless",
  },
];

export default function ArchitecturePage() {
  const [openStage, setOpenStage] = useState<Stage | null>(null);

  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">System architecture</div>
          <h1 className="arch-hero-title">A continuous compliance brain for enterprise AI</h1>
          <p className="arch-hero-sub">
            ARCA SENTRY is a multi-agent system that audits every interaction your AI produces, in
            real time, against EU regulatory frameworks. Built around five specialized auditor agents,
            a Gemini Pro synthesizer, and an append-only hash-chained event store — every decision is
            forensically reproducible and tamper-evident by design.
          </p>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card">
            <div className="metric-val">&lt; 6s</div>
            <div className="metric-lbl">End-to-end p95 latency</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">5</div>
            <div className="metric-lbl">Specialized auditor agents</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">100%</div>
            <div className="metric-lbl">Audit log integrity (SHA-256)</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">5</div>
            <div className="metric-lbl">Languages supported</div>
          </div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Request flow · how an interaction becomes an audited decision</h2>
          <p className="muted">
            Every chat or voice exchange goes through the same six-stage pipeline. Stages run in
            parallel where possible — total wall time stays under six seconds even with frontier models
            in the synthesizer.
          </p>
        </div>
        <div className="flow-diagram">
          {FLOW.map((stage, i) => (
            <FlowStage
              key={stage.num}
              stage={stage}
              showArrow={i < FLOW.length - 1}
              onOpen={() => setOpenStage(stage)}
            />
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 14, textAlign: "center" }}>
          Click any stage to inspect its API contract, request/response, and source files.
        </p>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>The five auditor agents · domain-specialized by design</h2>
          <p className="muted">
            Each agent owns one regulation or risk family. They share a base class (heuristic
            pre-filter → specialized LLM judgment) but use different system prompts and different
            open-source models from Featherless. This keeps p95 low: most interactions skip the LLM
            call entirely.
          </p>
        </div>
        <div className="agents-table">
          {AGENTS.map((a) => (
            <div key={a.key} className="agent-row">
              <div className={`agent-badge ${a.key}`}>{a.label}</div>
              <div className="agent-detail">
                <div className="agent-detail-title">{a.title}</div>
                <div className="agent-detail-sub">{a.sub}</div>
                <div className="agent-detail-desc">{a.desc}</div>
                <div className="agent-detail-meta">
                  Powered by <code>{a.meta}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Severity model · three tiers, consensus protected</h2>
          <p className="muted">
            A single hallucinating agent cannot unilaterally block production traffic. Critical fires
            only when multiple agents converge — or when the evidence is irrefutable.
          </p>
        </div>
        <div className="severity-grid">
          <div className="sev-card advisory">
            <div className="sev-card-head">
              <span className="sev-pill advisory">ADVISORY</span>
              <span className="sev-card-action">action: allow</span>
            </div>
            <div className="sev-card-trigger">≥ 1 agent at conf ≥ 0.50</div>
            <div className="sev-card-desc">
              Logged to event store only. No alert. Useful for trending and weak-signal monitoring.
            </div>
          </div>
          <div className="sev-card warning">
            <div className="sev-card-head">
              <span className="sev-pill warning">WARNING</span>
              <span className="sev-card-action">action: warn</span>
            </div>
            <div className="sev-card-trigger">≥ 1 agent at conf ≥ 0.70</div>
            <div className="sev-card-desc">
              Compliance team notified. Ticket auto-opens with cost estimate. Response is not blocked.
            </div>
          </div>
          <div className="sev-card critical">
            <div className="sev-card-head">
              <span className="sev-pill critical">CRITICAL</span>
              <span className="sev-card-action">action: block</span>
            </div>
            <div className="sev-card-trigger">
              ≥ 2 agents at conf ≥ 0.85, <span className="or">or</span>
              <br />
              ≥ 1 agent at conf ≥ 0.95, <span className="or">or</span>
              <br />
              prompt_injection + pii_leak together, <span className="or">or</span>
              <br />
              ≥ 3 distinct regulations flagged
            </div>
            <div className="sev-card-desc">
              Response is intercepted at the gateway before it reaches the end user. Ticket flagged
              red. Synthesizer report dispatched to compliance lead.
            </div>
          </div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Tamper-evident audit log · forensic by default</h2>
          <p className="muted">
            Every event the system observes — interactions, findings, decisions, ticket status changes
            — appends to a SHA-256 hash-chained event store. The chain is verifiable end-to-end in a
            single call.
          </p>
        </div>
        <div className="integrity-grid">
          <div className="integrity-card">
            <LinkIcon className="integrity-icon" size={28} />
            <div className="integrity-title">Hash chain</div>
            <div className="integrity-desc">
              Each record carries a SHA-256 hash that combines the previous record's hash plus the new
              payload. Modifying a past event invalidates every hash downstream.
            </div>
            <pre className="integrity-snippet">
              {`self_hash = SHA256(
    prev_hash + created_at +
    event_type + payload_json
)`}
            </pre>
          </div>
          <div className="integrity-card">
            <Lock className="integrity-icon" size={28} />
            <div className="integrity-title">Append-only at app layer</div>
            <div className="integrity-desc">
              The <code>EventStore</code> class exposes no UPDATE or DELETE methods. Workflow state
              changes (open → resolved) are themselves new events.
            </div>
          </div>
          <div className="integrity-card">
            <ShieldCheck className="integrity-icon" size={28} />
            <div className="integrity-title">Verifiable in O(n)</div>
            <div className="integrity-desc">
              <code>EventStore.verify_integrity()</code> recomputes the chain end-to-end. Returns false
              on any inconsistency. Regulators can run it on a copy of the database.
            </div>
          </div>
          <div className="integrity-card">
            <Database className="integrity-icon" size={28} />
            <div className="integrity-title">Postgres alternative</div>
            <div className="integrity-desc">
              For enterprise deployments, an optional Postgres schema enforces immutability at the
              database layer via row-level triggers preventing UPDATE/DELETE.
            </div>
          </div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Security guarantees</h2>
          <p className="muted">
            Built-in by default; nothing optional. Aligned to OWASP LLM Top 10, SOC 2 readiness, and
            EU AI Act enforcement controls.
          </p>
        </div>
        <div className="sec-grid">
          <div className="sec-card">
            <Key className="sec-icon" size={26} />
            <div className="sec-title">No secrets in transit or at rest</div>
            <div className="sec-desc">
              API keys live in <code>.env</code> outside git. The vulnerable demo bot's fake keys are
              explicit hooks for testing — verified deterministically.
            </div>
          </div>
          <div className="sec-card">
            <ShieldOff className="sec-icon" size={26} />
            <div className="sec-title">Prompt injection hardened</div>
            <div className="sec-desc">
              System prompts are constructed with explicit separators. Every agent uses structured
              JSON output. Compliance-side regex catches credential leaks if a downstream bot is
              compromised.
            </div>
          </div>
          <div className="sec-card">
            <FileCheck className="sec-icon" size={26} />
            <div className="sec-title">Auditable by regulators</div>
            <div className="sec-desc">
              Any decision can be replayed deterministically from the event store. PDF reports include
              event hash for chain-of-custody verification.
            </div>
          </div>
          <div className="sec-card">
            <Ban className="sec-icon" size={26} />
            <div className="sec-title">Human-reversible blocks</div>
            <div className="sec-desc">
              A blocking decision is itself a logged event. Operators can override (status: dismissed)
              without modifying historical findings.
            </div>
          </div>
        </div>
      </section>

      <StageDetailPanel stage={openStage} onClose={() => setOpenStage(null)} />
    </div>
  );
}

function FlowStage({
  stage,
  showArrow,
  onOpen,
}: {
  stage: Stage;
  showArrow: boolean;
  onOpen: () => void;
}) {
  const { Icon } = stage;
  return (
    <>
      <button
        type="button"
        className="flow-stage flow-stage-interactive"
        onClick={onOpen}
        aria-label={`Open ${stage.title} details`}
      >
        <div className="flow-num">{stage.num}</div>
        <Icon className="flow-icon" size={24} />
        <div className="flow-title">{stage.title}</div>
        <div className="flow-desc">{stage.desc}</div>
        <span className="flow-stage-cta">
          View API contract <ArrowRight size={11} />
        </span>
      </button>
      {showArrow && (
        <div className="flow-arrow">
          <ArrowRight size={20} />
        </div>
      )}
    </>
  );
}

function StageDetailPanel({
  stage,
  onClose,
}: {
  stage: Stage | null;
  onClose: () => void;
}) {
  const isOpen = stage !== null;
  const Icon = stage?.Icon;
  return (
    <>
      <div
        className={`stage-detail-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`stage-detail ${isOpen ? "open" : ""}`}>
        {stage && Icon && (
          <>
            <div className="stage-detail-head">
              <div className="stage-detail-num">{stage.num}</div>
              <Icon size={26} />
              <div className="stage-detail-title">{stage.title}</div>
              <button className="stage-detail-close" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="stage-detail-body">
              <div className="stage-detail-section">
                <div className="stage-detail-label">Endpoint / call site</div>
                <code className="stage-detail-endpoint">{stage.detail.endpoint}</code>
              </div>
              {stage.detail.request && (
                <div className="stage-detail-section">
                  <div className="stage-detail-label">Request shape</div>
                  <pre className="stage-detail-code">{stage.detail.request}</pre>
                </div>
              )}
              {stage.detail.response && (
                <div className="stage-detail-section">
                  <div className="stage-detail-label">Response shape</div>
                  <pre className="stage-detail-code">{stage.detail.response}</pre>
                </div>
              )}
              {stage.detail.files && stage.detail.files.length > 0 && (
                <div className="stage-detail-section">
                  <div className="stage-detail-label">Source files</div>
                  <div className="stage-detail-files">
                    {stage.detail.files.map((f) => (
                      <code key={f} className="stage-detail-file">{f}</code>
                    ))}
                  </div>
                </div>
              )}
              {stage.detail.notes && (
                <div className="stage-detail-section stage-detail-notes">
                  <div className="stage-detail-label">Performance notes</div>
                  <p>{stage.detail.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
