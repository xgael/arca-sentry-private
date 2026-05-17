"use client";

// ARCA SENTRY — Playground page (Next.js port of playground.html + playground.js).
// User chats with a deliberately vulnerable bot; SENTRY audits every exchange
// live and renders the five-agent verdict + findings.
//
// Endpoint mapping (per migration brief):
//   POST /playground/send         { message, bot_profile, session_id }
//   POST /playground/reset        { session_id }
//   GET  /playground/suggestions
//
// NOTE: the legacy backend exposes /playground/chat and /playground/suggested-prompts.
// Adjust apiPost/apiGet paths below if your backend uses the legacy names.

import { useCallback, useEffect, useRef, useState } from "react";

import Topbar from "@/components/chrome/Topbar";
import { apiGet, apiPost, type Finding, type Severity } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { REG_LABELS, escapeHtml } from "@/lib/format";

/* ─────────────────────── Types ─────────────────────── */

type Action = "allow" | "warn" | "block";
type BotProfile = "banking" | "insurance" | "healthcare";

interface SuggestedPrompt {
  icon: string;
  label: string;
  prompt: string;
}

interface SuggestionsResponse {
  items: SuggestedPrompt[];
}

interface ChatResponse {
  session_id: string;
  bot_reply: string;
  severity: Severity;
  action_taken: Action;
  interaction_id: string;
  findings: Finding[];
}

type AgentName =
  | "eu_ai_act_auditor"
  | "gdpr_auditor"
  | "dora_auditor"
  | "pii_leak_detector"
  | "prompt_injection_detector";

type AgentState = "idle" | "audit" | "flag" | "clean";

interface PlaygroundMessage {
  id: string;
  who: "user" | "bot";
  text: string;
  severity?: Severity;
  action?: Action;
  thinking?: boolean;
}

const AGENTS: ReadonlyArray<{ name: AgentName; label: string }> = [
  { name: "eu_ai_act_auditor", label: "EU AI Act" },
  { name: "gdpr_auditor", label: "GDPR" },
  { name: "dora_auditor", label: "DORA" },
  { name: "pii_leak_detector", label: "PII Leak" },
  { name: "prompt_injection_detector", label: "Prompt Injection" },
];

const PROFILE_OPTIONS: ReadonlyArray<{ value: BotProfile; label: string }> = [
  { value: "banking", label: "🏦 ACME Bank (banking)" },
  { value: "insurance", label: "🛡️ ACME Insurance" },
  { value: "healthcare", label: "🏥 ACME Health" },
];

const VERDICT_KEY: Record<Severity, string> = {
  advisory: "verdict.advisory",
  warning: "verdict.warning",
  critical: "verdict.critical",
};

const VERDICT_ICON: Record<Severity, string> = {
  advisory: "✓",
  warning: "⚠",
  critical: "🚫",
};

const REG_ICON: Record<string, string> = {
  prompt_injection: "🧨",
  pii_leak: "📤",
  eu_ai_act: "🚨",
  gdpr: "⚖",
  dora: "🏦",
};

/* ─────────────────────── Page ─────────────────────── */

export default function PlaygroundPage() {
  const { t } = useT();

  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([]);
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [agentStates, setAgentStates] = useState<Record<AgentName, AgentState>>({
    eu_ai_act_auditor: "idle",
    gdpr_auditor: "idle",
    dora_auditor: "idle",
    pii_leak_detector: "idle",
    prompt_injection_detector: "idle",
  });
  const [sentrySub, setSentrySub] = useState<string>(t("pg.sentry.awaiting"));
  const [verdict, setVerdict] = useState<ChatResponse | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [alert, setAlert] = useState<
    | { severity: Severity; icon: string; title: string; detail: string }
    | null
  >(null);

  const [profile, setProfile] = useState<BotProfile>("banking");
  const [inputText, setInputText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [stats, setStats] = useState({ msgs: 0, flags: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh sentrySub label when language changes (while in initial state).
  useEffect(() => {
    if (!verdict) setSentrySub(t("pg.sentry.awaiting"));
  }, [t, verdict]);

  // Load suggested prompts once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // TODO: legacy endpoint is `/playground/suggested-prompts`.
        const data = await apiGet<SuggestionsResponse>("/playground/suggestions");
        if (!cancelled) setSuggestions(data.items ?? []);
      } catch (e) {
        console.error("Failed to load suggestions", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll chat on new messages.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const showAlert = useCallback(
    (data: ChatResponse) => {
      const first = data.findings?.[0];
      let title = `${data.severity.toUpperCase()} · ${data.action_taken}`;
      let icon = "🚨";
      let detail = "—";

      if (first) {
        const reg = REG_LABELS[first.regulation] ?? first.regulation;
        title = `${reg.toUpperCase()} ${t("alert.detected")}`;
        if (first.regulation === "prompt_injection") title = `🧨 ${t("alert.detected")}`;
        else if (first.regulation === "pii_leak") title = `📤 ${t("alert.detected")}`;
        else if (first.regulation === "eu_ai_act") title = `🚨 ${t("alert.detected")}`;
        else if (first.regulation === "gdpr") title = `⚖ ${t("alert.detected")}`;
        else if (first.regulation === "dora") title = `🏦 ${t("alert.detected")}`;
        icon = REG_ICON[first.regulation] ?? "🚨";

        const rationale = first.rationale ?? "";
        detail = rationale.length > 200 ? `${rationale.slice(0, 200)}…` : rationale || "—";
      }

      setAlert({ severity: data.severity, icon, title, detail });
      if (alertTimer.current) clearTimeout(alertTimer.current);
      alertTimer.current = setTimeout(() => setAlert(null), 8000);
    },
    [t],
  );

  const hideAlert = useCallback(() => {
    setAlert(null);
    if (alertTimer.current) {
      clearTimeout(alertTimer.current);
      alertTimer.current = null;
    }
  }, []);

  const resetSentryPane = useCallback(() => {
    setAgentStates({
      eu_ai_act_auditor: "idle",
      gdpr_auditor: "idle",
      dora_auditor: "idle",
      pii_leak_detector: "idle",
      prompt_injection_detector: "idle",
    });
    setVerdict(null);
    setFindings([]);
    setSentrySub(t("pg.sentry.awaiting"));
  }, [t]);

  const resetChat = useCallback(async () => {
    // Fire-and-forget — UI resets locally either way.
    if (sessionId) {
      try {
        await apiPost("/playground/reset", { session_id: sessionId });
      } catch (e) {
        console.warn("playground reset failed", e);
      }
    }
    setSessionId(null);
    setMessages([]);
    resetSentryPane();
    hideAlert();
    setStats({ msgs: 0, flags: 0 });
  }, [sessionId, resetSentryPane, hideAlert]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isThinking || !text.trim()) return;
      setIsThinking(true);
      hideAlert();

      const userId = `u-${Date.now()}`;
      const thinkingId = `b-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userId, who: "user", text },
        { id: thinkingId, who: "bot", text: "…", thinking: true },
      ]);

      // SENTRY: all agents go active
      setAgentStates({
        eu_ai_act_auditor: "audit",
        gdpr_auditor: "audit",
        dora_auditor: "audit",
        pii_leak_detector: "audit",
        prompt_injection_detector: "audit",
      });
      setSentrySub(t("pg.sentry.auditing"));
      setInputText("");

      try {
        // TODO: legacy endpoint is `/playground/chat`.
        const data = await apiPost<ChatResponse>("/playground/send", {
          message: text,
          bot_profile: profile,
          session_id: sessionId,
        });
        setSessionId(data.session_id);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? {
                  ...m,
                  text: data.bot_reply,
                  thinking: false,
                  severity: data.severity,
                  action: data.action_taken,
                }
              : m,
          ),
        );

        const flagged = new Set((data.findings ?? []).map((f) => f.agent));
        setAgentStates({
          eu_ai_act_auditor: flagged.has("eu_ai_act_auditor") ? "flag" : "clean",
          gdpr_auditor: flagged.has("gdpr_auditor") ? "flag" : "clean",
          dora_auditor: flagged.has("dora_auditor") ? "flag" : "clean",
          pii_leak_detector: flagged.has("pii_leak_detector") ? "flag" : "clean",
          prompt_injection_detector: flagged.has("prompt_injection_detector")
            ? "flag"
            : "clean",
        });
        setVerdict(data);
        setFindings(data.findings ?? []);
        setSentrySub(`interaction ${data.interaction_id.slice(0, 8)}…`);

        if (data.severity === "critical" || data.severity === "warning") {
          showAlert(data);
          setStats((s) => ({ msgs: s.msgs + 1, flags: s.flags + 1 }));
        } else {
          setStats((s) => ({ msgs: s.msgs + 1, flags: s.flags }));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? { ...m, text: `(error: ${msg})`, thinking: false, severity: "advisory", action: "allow" }
              : m,
          ),
        );
        setSentrySub(t("pg.sentry.error"));
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [isThinking, profile, sessionId, hideAlert, t, showAlert],
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(inputText.trim());
  };

  const onProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile(e.target.value as BotProfile);
    resetChat();
  };

  return (
    <>
      <Topbar pageKey="playground" />

      {alert && (
        <div className={`alert-banner show ${alert.severity}`}>
          <div className="alert-icon">{alert.icon}</div>
          <div className="alert-text">
            <div className="alert-title">{alert.title}</div>
            <div className="alert-detail">{alert.detail}</div>
          </div>
          <button className="alert-close" type="button" onClick={hideAlert}>
            ✕
          </button>
        </div>
      )}

      <main className="playground-main">
        {/* HERO */}
        <section className="pg-hero">
          <div className="pg-hero-text">
            <div className="pg-hero-eyebrow">{t("pg.hero.eyebrow")}</div>
            <div className="pg-hero-title">{t("pg.hero.title")}</div>
            <div className="pg-hero-sub">{t("pg.hero.sub")}</div>
          </div>
          <div className="pg-hero-stats">
            <div className="pg-hero-stat">
              <div className="pg-hero-stat-value">{stats.msgs}</div>
              <div className="pg-hero-stat-label">{t("pg.hero.stat.msgs")}</div>
            </div>
            <div className="pg-hero-stat">
              <div className="pg-hero-stat-value">{stats.flags}</div>
              <div className="pg-hero-stat-label">{t("pg.hero.stat.flags")}</div>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="playground-toolbar card">
          <div className="toolbar-left">
            <label htmlFor="profile-select">{t("pg.toolbar.bot_label")}</label>
            <select
              id="profile-select"
              className="profile-select"
              value={profile}
              onChange={onProfileChange}
            >
              {PROFILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn-reset" onClick={resetChat}>
              {t("pg.toolbar.reset")}
            </button>
          </div>
          <div
            className="toolbar-hint"
            dangerouslySetInnerHTML={{ __html: t("pg.toolbar.hint_html") }}
          />
        </section>

        {/* SUGGESTED ATTACKS */}
        <section className="card">
          <h2>{t("pg.suggested.title")}</h2>
          <p className="muted">{t("pg.suggested.desc")}</p>
          <div className="suggested-grid">
            {suggestions.map((item, i) => (
              <button
                key={`${item.label}-${i}`}
                type="button"
                className="suggested-card"
                onClick={() => sendMessage(item.prompt)}
              >
                <div className="ico">{item.icon}</div>
                <div className="body">
                  <div className="label">{item.label}</div>
                  <div className="prompt">
                    {item.prompt.length > 70
                      ? `${item.prompt.slice(0, 70)}…`
                      : item.prompt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* SPLIT CHAT + SENTRY */}
        <section className="split">
          {/* LEFT: chat */}
          <div className="card chat-pane">
            <div className="chat-head">
              <h2>{t("pg.conversation.title")}</h2>
              <span className="chat-actor">vulnerable-demo-bot · {profile}</span>
            </div>

            <div className="chat-messages" ref={messagesRef}>
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <p>{t("pg.empty.line1")}</p>
                  <p className="muted small">{t("pg.empty.line2")}</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`msg ${m.who}${m.thinking ? " thinking" : ""}${
                      m.action === "block" ? " blocked" : ""
                    }`}
                  >
                    {m.text}
                    {!m.thinking && m.severity && m.action && (
                      <div className="msg-meta">
                        severity: {m.severity} · action: {m.action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <form className="chat-input" onSubmit={onSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("pg.input.placeholder")}
                autoComplete="off"
              />
              <button type="submit" disabled={isThinking}>
                {t("pg.send")}
              </button>
            </form>
          </div>

          {/* RIGHT: SENTRY */}
          <div className="card sentry-pane">
            <div className="sentry-head">
              <h2>{t("pg.sentry.title")}</h2>
              <span className="sentry-sub">{sentrySub}</span>
            </div>

            <div className="agent-grid playground-agents">
              {AGENTS.map(({ name, label }) => {
                const state = agentStates[name];
                return (
                  <div
                    key={name}
                    className={`agent${state === "audit" ? " active" : ""}${
                      state === "flag" ? " flagged" : ""
                    }`}
                    data-name={name}
                  >
                    <div className="agent-name">{label}</div>
                    <div className="agent-state">{state}</div>
                  </div>
                );
              })}
            </div>

            <div className={`verdict-box ${verdict ? verdict.severity : "empty"}`}>
              {verdict ? (
                <>
                  <div className={`verdict-header ${verdict.severity}`}>
                    {VERDICT_ICON[verdict.severity]} {t(VERDICT_KEY[verdict.severity])}
                  </div>
                  <div className="verdict-summary">
                    {verdict.findings.length} finding
                    {verdict.findings.length === 1 ? "" : "s"} ·{" "}
                    <a href={`/reports/${verdict.interaction_id}`} target="_blank" rel="noreferrer">
                      full report →
                    </a>
                  </div>
                </>
              ) : (
                <div className="verdict-empty-msg">{t("pg.sentry.empty_verdict")}</div>
              )}
            </div>

            <div className="findings-stack">
              {verdict && findings.length === 0 ? (
                <div className="muted small">{t("pg.sentry.no_findings")}</div>
              ) : (
                findings.map((f, i) => {
                  const reg = REG_LABELS[f.regulation] ?? f.regulation;
                  return (
                    <div key={`${f.agent}-${i}`} className={`finding-mini ${f.regulation}`}>
                      <div className="finding-mini-head">
                        <span className="finding-mini-name">
                          {escapeHtml(f.agent)} · {reg}
                          {f.article ? ` · ${f.article}` : ""}
                        </span>
                        <span className="finding-mini-conf">
                          {(f.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="finding-mini-rationale">{f.rationale ?? ""}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
