"use client";

/**
 * ARCA SENTRY — Chat (merged Playground + Voice).
 * Single chatbot UI; user can switch between text and voice modes without
 * losing history or bot profile. SENTRY's verdict + findings appear inline
 * under each bot reply (no side-panel competing for attention).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, RotateCcw, Send, Type } from "lucide-react";

import Topbar from "@/components/chrome/Topbar";
import { apiGet, apiPost, type Finding, type Severity } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { REG_LABELS } from "@/lib/format";

/* ─────────────── Web Speech API minimal typings ─────────────── */
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { readonly length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message?: string; }
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; maxAlternatives: number; lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start(): void; stop(): void; abort(): void;
}
interface SpeechRecognitionCtor { new (): SpeechRecognitionInstance; }
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    webkitAudioContext?: typeof AudioContext;
  }
}

/* ─────────────── Domain types ─────────────── */
type Action = "allow" | "warn" | "block";
type Mode = "text" | "voice";

interface ChatResponse {
  session_id: string;
  interaction_id: string;
  bot_reply: string;
  severity: Severity;
  action_taken: Action;
  findings: Finding[];
}

interface BotProfile { id: string; label: string; icon: string; }
interface SuggestedPrompt { icon: string; label: string; prompt: string; }

interface Msg {
  id: string;
  who: "user" | "bot";
  text: string;
  partial?: boolean;
  thinking?: boolean;
  severity?: Severity;
  action?: Action;
  findings?: Finding[];
  interactionId?: string;
}

/* ─────────────── Constants ─────────────── */
const FALLBACK_PROFILES: ReadonlyArray<BotProfile> = [
  { id: "banking", label: "ACME Bank", icon: "🏦" },
  { id: "insurance", label: "ACME Insurance", icon: "🛡️" },
  { id: "healthcare", label: "ACME Health", icon: "🏥" },
];

const LANG_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "en-US", label: "🇬🇧 EN" },
  { value: "es-MX", label: "🇲🇽 ES" },
  { value: "it-IT", label: "🇮🇹 IT" },
  { value: "pt-BR", label: "🇧🇷 PT" },
  { value: "zh-CN", label: "🇨🇳 ZH" },
];

const REG_ICON: Record<string, string> = {
  prompt_injection: "🧨", pii_leak: "📤", eu_ai_act: "🚨", gdpr: "⚖", dora: "🏦",
};

const VERDICT_ICON: Record<Severity, string> = {
  advisory: "✓", warning: "⚠", critical: "🚫",
};

/* ─────────────── Page ─────────────── */

export default function ChatPage() {
  const { t } = useT();

  /* core chat state */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  /* bot profile */
  const [profile, setProfile] = useState<string>("banking");
  const [profileOptions, setProfileOptions] = useState<ReadonlyArray<BotProfile>>(FALLBACK_PROFILES);

  /* suggested prompts */
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([]);

  /* mode */
  const [mode, setMode] = useState<Mode>("text");
  const [inputText, setInputText] = useState("");

  /* voice mode */
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [partialText, setPartialText] = useState("");

  /* alert banner */
  const [alert, setAlert] = useState<
    | { severity: Severity; icon: string; title: string; detail: string }
    | null
  >(null);

  /* refs */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const isRecordingRef = useRef(false);
  const finalTextRef = useRef("");
  const interimTextRef = useRef("");
  const voiceLangRef = useRef(voiceLang);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { voiceLangRef.current = voiceLang; }, [voiceLang]);

  /* ─────────────── Init data loads ─────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiGet<{ items: SuggestedPrompt[] }>("/playground/suggested-prompts");
        if (!cancelled) setSuggestions(d.items ?? []);
      } catch {/* ignore */}
    })();
    (async () => {
      try {
        const d = await apiGet<{ profiles: BotProfile[] }>("/playground/profiles");
        if (!cancelled && d.profiles?.length) {
          setProfileOptions(d.profiles);
          if (!d.profiles.find((p) => p.id === profile)) setProfile(d.profiles[0].id);
        }
      } catch {/* fallback */}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-scroll messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isThinking, partialText]);

  /* ─────────────── Alert helpers ─────────────── */
  const hideAlert = useCallback(() => {
    setAlert(null);
    if (alertTimerRef.current) { clearTimeout(alertTimerRef.current); alertTimerRef.current = null; }
  }, []);

  const showAlert = useCallback((data: ChatResponse) => {
    const first = data.findings?.[0];
    let icon = "🚨";
    let title = `${data.severity.toUpperCase()} · ${data.action_taken}`;
    let detail = "";
    if (first) {
      const reg = REG_LABELS[first.regulation] ?? first.regulation;
      title = `${reg.toUpperCase()} ${t("alert.detected")}`;
      icon = REG_ICON[first.regulation] ?? "🚨";
      const r = first.rationale ?? "";
      detail = r.length > 200 ? `${r.slice(0, 200)}…` : r;
    }
    setAlert({ severity: data.severity, icon, title, detail });
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setAlert(null), 8000);
  }, [t]);

  /* ─────────────── Send a message (shared by text + voice) ─────────────── */
  const sendMessage = useCallback(async (text: string) => {
    if (isThinking || !text.trim()) return;
    setIsThinking(true);
    hideAlert();

    const userId = `u-${Date.now()}`;
    const thinkingId = `b-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, who: "user", text },
      { id: thinkingId, who: "bot", text: "", thinking: true },
    ]);
    setInputText("");

    try {
      const data = await apiPost<ChatResponse>("/playground/chat", {
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
                findings: data.findings ?? [],
                interactionId: data.interaction_id,
              }
            : m,
        ),
      );
      // Voice mode: speak the reply
      if (mode === "voice" && typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(data.bot_reply);
          utter.lang = voiceLangRef.current;
          window.speechSynthesis.speak(utter);
        } catch {/* ignore */}
      }
      if (data.severity === "critical" || data.severity === "warning") showAlert(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, text: `(error: ${msg})`, thinking: false, severity: "advisory", action: "allow" }
            : m,
        ),
      );
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  }, [isThinking, hideAlert, profile, sessionId, mode, showAlert]);

  /* ─────────────── Composer (text mode) ─────────────── */
  const onTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputText.trim());
  };

  const onTextKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputText.trim());
    }
  };

  /* ─────────────── Reset ─────────────── */
  const resetChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    hideAlert();
    setPartialText("");
  }, [hideAlert]);

  const onProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile(e.target.value);
    resetChat();
  };

  /* ─────────────── Voice: mic level pump ─────────────── */
  const pumpLevel = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const frame = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const arr = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(arr);
      let max = 0;
      for (let i = 0; i < arr.length; i++) {
        const v = Math.abs((arr[i] - 128) / 128);
        if (v > max) max = v;
      }
      setMicLevel(Math.min(100, Math.round(max * 220)));
      rafRef.current = requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const acquireMic = useCallback(async () => {
    if (analyserRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) throw new Error("AudioContext unsupported");
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      pumpLevel();
      return true;
    } catch {
      setVoiceSupported(false);
      return false;
    }
  }, [pumpLevel]);

  /* Voice: setup SpeechRecognition */
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setIsRecording(true);
      finalTextRef.current = "";
      interimTextRef.current = "";
      setPartialText("…");
    };
    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) finalTextRef.current = `${finalTextRef.current} ${final}`.trim();
      if (interim) interimTextRef.current = interim.trim();
      setPartialText(`${finalTextRef.current} ${interim}`.trim() || "…");
    };
    rec.onerror = () => { setIsRecording(false); setPartialText(""); };
    rec.onend = () => {
      setIsRecording(false);
      const captured = (finalTextRef.current || interimTextRef.current || "").trim();
      setPartialText("");
      if (captured) void sendMessage(captured);
    };
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {/* ignore */}
      recognitionRef.current = null;
    };
  }, [sendMessage]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    audioCtxRef.current?.close().catch(() => undefined);
  }, []);

  const toggleRecording = useCallback(async () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    if (isRecordingRef.current) { rec.stop(); return; }
    const ok = await acquireMic();
    if (!ok) return;
    rec.lang = voiceLangRef.current;
    try { rec.start(); } catch {/* may already be running */}
  }, [acquireMic]);

  /* ─────────────── Welcome state ─────────────── */
  const activeProfile = useMemo(
    () => profileOptions.find((p) => p.id === profile) ?? profileOptions[0],
    [profile, profileOptions],
  );

  const isEmpty = messages.length === 0;

  return (
    <>
      <Topbar pageKey="chat" />

      {alert && (
        <div className={`alert-banner show ${alert.severity}`}>
          <div className="alert-icon">{alert.icon}</div>
          <div className="alert-text">
            <div className="alert-title">{alert.title}</div>
            <div className="alert-detail">{alert.detail}</div>
          </div>
          <button className="alert-close" type="button" onClick={hideAlert}>✕</button>
        </div>
      )}

      <main className="chat-shell">
        <header className="chat-topbar">
          <div className="chat-bot">
            <div className="chat-bot-avatar">{activeProfile?.icon ?? "🤖"}</div>
            <div className="chat-bot-meta">
              <select className="chat-bot-name" value={profile} onChange={onProfileChange}>
                {profileOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
              <div className="chat-bot-sub">Vulnerable demo bot · audited by SENTRY</div>
            </div>
          </div>
          <button
            type="button"
            className="chat-reset"
            onClick={resetChat}
            disabled={isEmpty}
            aria-label="Reset conversation"
          >
            <RotateCcw className="icon-svg" />
            <span>Reset</span>
          </button>
        </header>

        <section className="chat-stream">
          {isEmpty && (
            <div className="chat-welcome">
              <div className="chat-welcome-mark">{activeProfile?.icon ?? "🤖"}</div>
              <h1 className="chat-welcome-title">
                Talk to <strong>{activeProfile?.label ?? "the bot"}</strong>
              </h1>
              <p className="chat-welcome-sub">
                The bot is intentionally vulnerable for the demo. SENTRY audits every
                exchange in real time. Try one of these — or type your own.
              </p>
              {suggestions.length > 0 && (
                <div className="chat-suggestions">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.label}-${i}`}
                      type="button"
                      className="chat-suggestion-card"
                      onClick={() => void sendMessage(s.prompt)}
                    >
                      <div className="ico">{s.icon}</div>
                      <div className="body">
                        <div className="label">{s.label}</div>
                        <div className="prompt">{s.prompt}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) =>
            m.who === "user" ? (
              <UserBubble key={m.id} text={m.text} />
            ) : (
              <BotBubble key={m.id} msg={m} />
            ),
          )}

          {/* When recording, show the live partial transcript as a soft preview bubble */}
          {mode === "voice" && partialText && (
            <div className="chat-bubble user partial">
              <div className="bubble-content">{partialText}</div>
            </div>
          )}

          {isThinking && !messages.some((m) => m.thinking) && (
            <ThinkingBubble />
          )}

          <div ref={messagesEndRef} />
        </section>

        <footer className="chat-composer">
          <div className="chat-mode-toggle">
            <button
              type="button"
              className={mode === "text" ? "active" : ""}
              onClick={() => setMode("text")}
            >
              <Type className="icon-svg" />
              <span>Text</span>
            </button>
            <button
              type="button"
              className={mode === "voice" ? "active" : ""}
              onClick={() => setMode("voice")}
              disabled={!voiceSupported}
            >
              <Mic className="icon-svg" />
              <span>Voice</span>
            </button>
          </div>

          {mode === "text" ? (
            <form className="chat-input-text" onSubmit={onTextSubmit}>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Message the bot…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={onTextKey}
                disabled={isThinking}
              />
              <button type="submit" disabled={isThinking || !inputText.trim()} aria-label="Send">
                <Send className="icon-svg" />
              </button>
            </form>
          ) : (
            <div className="chat-input-voice">
              <button
                type="button"
                className={`mic-orb ${isRecording ? "recording" : ""}`}
                onClick={toggleRecording}
                disabled={!voiceSupported || isThinking}
                aria-label={isRecording ? "Stop recording" : "Hold to talk"}
              >
                <Mic className="icon-svg" />
              </button>
              <div className="mic-orb-meta">
                <div className="mic-orb-label">
                  {!voiceSupported
                    ? "Web Speech unavailable in this browser"
                    : isRecording
                    ? "Listening — tap to stop"
                    : "Tap to talk"}
                </div>
                <div className="mic-orb-level">
                  <div className="mic-orb-level-fill" style={{ width: `${micLevel}%` }} />
                </div>
              </div>
              <select
                className="chat-lang"
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                aria-label="Recognition language"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </footer>
      </main>
    </>
  );
}

/* ─────────────── Bubble components ─────────────── */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="chat-bubble user">
      <div className="bubble-content">{text}</div>
    </div>
  );
}

function BotBubble({ msg }: { msg: Msg }) {
  const [open, setOpen] = useState(false);
  if (msg.thinking) {
    return <ThinkingBubble />;
  }
  return (
    <div className="chat-bubble bot">
      <div className="bubble-content">{msg.text}</div>
      {msg.severity && (
        <button
          type="button"
          className={`bubble-verdict ${msg.severity} ${open ? "open" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="vd-icon">{VERDICT_ICON[msg.severity]}</span>
          <span className="vd-label">
            {msg.severity === "critical" ? "Critical · blocked at gateway" :
              msg.severity === "warning" ? "Warning · compliance notified" :
              "Advisory · logged"}
          </span>
          {(msg.findings?.length ?? 0) > 0 && (
            <span className="vd-count">{msg.findings!.length} finding{msg.findings!.length === 1 ? "" : "s"}</span>
          )}
        </button>
      )}
      {open && (msg.findings?.length ?? 0) > 0 && (
        <div className="bubble-findings">
          {msg.findings!.map((f, i) => (
            <div key={`${f.agent}-${i}`} className={`finding-mini ${f.regulation}`}>
              <div className="finding-mini-head">
                <span className="finding-mini-name">
                  {REG_ICON[f.regulation] ?? "•"} {REG_LABELS[f.regulation] ?? f.regulation}
                </span>
                <span className="finding-mini-conf">conf {(f.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="finding-mini-rationale">{f.rationale}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="chat-bubble bot thinking">
      <div className="thinking-dots" aria-label="Auditing">
        <span /><span /><span />
      </div>
      <div className="thinking-label">5 agents auditing in parallel…</div>
    </div>
  );
}
