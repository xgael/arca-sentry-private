"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bomb,
  Landmark,
  Scale,
  Siren,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import AgentGrid, { type AgentState } from "../components/AgentGrid";
import { api, type Decision, type Finding } from "../lib/api";
import { REG_LABELS } from "../lib/constants";
import "./playground.css";

type SuggestedItem = { icon: string; label: string; prompt: string };
type ChatMsg =
  | { id: number; who: "user"; text: string }
  | {
      id: number;
      who: "bot";
      text: string;
      thinking?: boolean;
      severity?: Decision["severity"];
      action?: string;
    };

const REG_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  prompt_injection: Bomb,
  pii_leak: UploadCloud,
  eu_ai_act: Siren,
  gdpr: Scale,
  dora: Landmark,
};

const TITLES: Record<string, string> = {
  prompt_injection: "PROMPT INJECTION DETECTED",
  pii_leak: "PII LEAK DETECTED",
  eu_ai_act: "EU AI ACT VIOLATION",
  gdpr: "GDPR VIOLATION",
  dora: "DORA VIOLATION",
};

const ALL_AGENTS = [
  "eu_ai_act_auditor",
  "gdpr_auditor",
  "dora_auditor",
  "pii_leak_detector",
  "prompt_injection_detector",
];

export default function PlaygroundPage() {
  const [profile, setProfile] = useState<"banking" | "insurance" | "healthcare">("banking");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedItem[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [verdict, setVerdict] = useState<Decision | null>(null);
  const [alert, setAlert] = useState<{ title: string; detail: string; severity: string; reg?: string } | null>(null);
  const [sessionMsgs, setSessionMsgs] = useState(0);
  const [sessionFlags, setSessionFlags] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const alertTimer = useRef<number | null>(null);

  useEffect(() => {
    api<{ items: SuggestedItem[] }>("/api/playground/suggested-prompts").then((d) => {
      if (d?.items) setSuggested(d.items);
    });
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const resetChat = useCallback(() => {
    setSessionId(null);
    setMsgs([]);
    setVerdict(null);
    setAgents({});
    setAlert(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isThinking || !text.trim()) return;
      setIsThinking(true);
      const userId = Date.now();
      const thinkingId = userId + 1;
      setMsgs((m) => [
        ...m,
        { id: userId, who: "user", text },
        { id: thinkingId, who: "bot", text: "…", thinking: true },
      ]);
      setInput("");
      setAgents(
        ALL_AGENTS.reduce<Record<string, AgentState>>((acc, a) => {
          acc[a] = "active";
          return acc;
        }, {}),
      );
      setAlert(null);

      const d = await api<Decision>("/api/playground/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, bot_profile: profile, session_id: sessionId }),
      });

      if (d) {
        if (d.session_id) setSessionId(d.session_id);
        setMsgs((m) =>
          m.map((x) =>
            x.id === thinkingId
              ? {
                  id: x.id,
                  who: "bot",
                  text: d.bot_reply || "",
                  severity: d.severity,
                  action: d.action_taken,
                }
              : x,
          ),
        );
        setVerdict(d);
        const flagged = new Set((d.findings || []).map((f) => f.agent));
        setAgents(
          ALL_AGENTS.reduce<Record<string, AgentState>>((acc, a) => {
            acc[a] = flagged.has(a) ? "flagged" : "clean";
            return acc;
          }, {}),
        );
        setSessionMsgs((n) => n + 1);
        if (d.severity === "critical" || d.severity === "warning") {
          setSessionFlags((n) => n + 1);
          const first = d.findings?.[0];
          if (first) {
            const reg = REG_LABELS[first.regulation] || first.regulation;
            setAlert({
              title: TITLES[first.regulation] || `${reg.toUpperCase()} VIOLATION DETECTED`,
              detail:
                first.rationale && first.rationale.length > 200
                  ? first.rationale.slice(0, 200) + "…"
                  : first.rationale || "Multiple agents flagged this interaction.",
              severity: d.severity,
              reg: first.regulation,
            });
            if (alertTimer.current) clearTimeout(alertTimer.current);
            alertTimer.current = window.setTimeout(() => setAlert(null), 8000);
          }
        }
      } else {
        setMsgs((m) =>
          m.map((x) =>
            x.id === thinkingId
              ? { id: x.id, who: "bot", text: "(error: request failed)", severity: "advisory", action: "allow" }
              : x,
          ),
        );
      }
      setIsThinking(false);
    },
    [isThinking, profile, sessionId],
  );

  const AlertIcon = alert?.reg ? REG_ICON[alert.reg] || Siren : Siren;

  return (
    <>
      {alert && (
        <div className={`alert-banner show ${alert.severity}`}>
          <div className="alert-icon">
            <AlertIcon size={28} />
          </div>
          <div className="alert-text">
            <div className="alert-title">{alert.title}</div>
            <div className="alert-detail">{alert.detail}</div>
          </div>
          <button className="alert-close" onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <div className="playground-main">
        <section className="pg-hero">
          <div className="pg-hero-text">
            <div className="pg-hero-eyebrow">Interactive demo</div>
            <div className="pg-hero-title">
              Talk to a deliberately vulnerable bank chatbot
            </div>
            <div className="pg-hero-sub">
              Send any message — the bot is configured to leak credentials, expose PII and skip
              mandatory disclosures. SENTRY audits the exchange in real time and shows you exactly
              what would trigger a regulatory fine.
            </div>
          </div>
          <div className="pg-hero-stats">
            <div className="pg-hero-stat">
              <div className="pg-hero-stat-value">{sessionMsgs}</div>
              <div className="pg-hero-stat-label">Messages this session</div>
            </div>
            <div className="pg-hero-stat">
              <div className="pg-hero-stat-value">{sessionFlags}</div>
              <div className="pg-hero-stat-label">Violations caught</div>
            </div>
          </div>
        </section>

        <section className="playground-toolbar card">
          <div className="toolbar-left">
            <label htmlFor="profile-select">Bot under audit:</label>
            <select
              id="profile-select"
              className="profile-select"
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value as "banking" | "insurance" | "healthcare");
                resetChat();
              }}
            >
              <option value="banking">ACME Bank (banking)</option>
              <option value="insurance">ACME Insurance</option>
              <option value="healthcare">ACME Health</option>
            </select>
            <button className="btn-reset" onClick={resetChat}>
              ↺ Reset conversation
            </button>
          </div>
          <div className="toolbar-hint">
            The bot is <strong>intentionally vulnerable</strong> for demo purposes. Try the suggested
            attacks below or type your own.
          </div>
        </section>

        <section className="card">
          <h2>Try one of these</h2>
          <p className="muted">Click any prompt to send it to the bot and watch SENTRY react.</p>
          <div className="suggested-grid">
            {suggested.map((s, i) => (
              <button key={i} className="suggested-card" onClick={() => sendMessage(s.prompt)}>
                <div className="ico">{s.icon}</div>
                <div className="body">
                  <div className="label">{s.label}</div>
                  <div className="prompt">
                    {s.prompt.length > 70 ? s.prompt.slice(0, 70) + "…" : s.prompt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="split">
          <div className="card chat-pane">
            <div className="chat-head">
              <h2>Conversation</h2>
              <span className="chat-actor">vulnerable-demo-bot · {profile}</span>
            </div>
            <div className="chat-messages" ref={chatRef}>
              {msgs.length === 0 ? (
                <div className="empty-chat">
                  <p>Start typing below — or click a suggested attack above.</p>
                  <p className="muted small">
                    Every exchange is audited by SENTRY in real time.
                  </p>
                </div>
              ) : (
                msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`msg ${m.who} ${"thinking" in m && m.thinking ? "thinking" : ""} ${"action" in m && m.action === "block" ? "blocked" : ""}`}
                  >
                    {m.text}
                    {m.who === "bot" && !("thinking" in m && m.thinking) && "severity" in m && m.severity && (
                      <div className="msg-meta">
                        severity: {m.severity} · action: {m.action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message to the bot… (Enter to send)"
                autoComplete="off"
              />
              <button type="submit" disabled={isThinking}>
                Send →
              </button>
            </form>
          </div>

          <div className="card sentry-pane">
            <div className="sentry-head">
              <h2>SENTRY · live audit</h2>
              <span className="sentry-sub">
                {isThinking
                  ? "auditing…"
                  : verdict
                    ? `interaction ${verdict.interaction_id.slice(0, 8)}…`
                    : "awaiting interaction…"}
              </span>
            </div>

            <AgentGrid className="playground-agents" states={agents} />

            <Verdict d={verdict} />
            <FindingsStack findings={verdict?.findings ?? null} />
          </div>
        </section>
      </div>
    </>
  );
}

function Verdict({ d }: { d: Decision | null }) {
  if (!d) {
    return (
      <div className="verdict-box empty">
        <div className="verdict-empty-msg">No interactions audited yet.</div>
      </div>
    );
  }
  const header =
    d.severity === "critical"
      ? "Critical · response BLOCKED at gateway"
      : d.severity === "warning"
        ? "Warning · compliance team notified"
        : "Advisory · logged only";
  return (
    <div className={`verdict-box ${d.severity}`}>
      <div className={`verdict-header ${d.severity}`}>{header}</div>
      <div className="verdict-summary">
        {d.findings.length} finding{d.findings.length === 1 ? "" : "s"}
        {" · "}
        <a href={`/api/reports/${d.interaction_id}`} target="_blank" rel="noopener">
          full report →
        </a>
      </div>
    </div>
  );
}

function FindingsStack({ findings }: { findings: Finding[] | null }) {
  if (!findings) return <div className="findings-stack" />;
  if (findings.length === 0) {
    return (
      <div className="findings-stack">
        <div className="muted small">No findings — all five agents cleared this interaction.</div>
      </div>
    );
  }
  return (
    <div className="findings-stack">
      {findings.map((f, i) => (
        <div key={i} className={`finding-mini ${f.regulation}`}>
          <div className="finding-mini-head">
            <span className="finding-mini-name">
              {f.agent} · {REG_LABELS[f.regulation] || f.regulation}
              {f.article ? ` · ${f.article}` : ""}
            </span>
            <span className="finding-mini-conf">{(f.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="finding-mini-rationale">{f.rationale || ""}</div>
        </div>
      ))}
    </div>
  );
}
