"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, MessageCircle, MessagesSquare, PlugZap, Radio } from "lucide-react";
import { api } from "../lib/api";
import "../architecture/architecture.css";
import "../playground/playground.css";
import "./connect.css";

type Channel = "proxy" | "http" | "web_url" | "whatsapp" | "facebook";

type Registered = {
  agent_id: string;
  pending?: boolean;
  next_step?: string;
  proxy_endpoint?: string;
};

const CHANNELS: Array<{
  id: Channel;
  Icon: React.ComponentType<{ size?: number }>;
  name: string;
  desc: string;
  badge: "Available" | "Coming soon";
  avail: boolean;
}> = [
  {
    id: "proxy",
    Icon: PlugZap,
    name: "Proxy mode",
    desc: "Drop-in for OpenAI / Anthropic / Gemini SDKs. Change one line, you're protected.",
    badge: "Available",
    avail: true,
  },
  {
    id: "http",
    Icon: Radio,
    name: "HTTP endpoint",
    desc: "Your bot exposes a REST endpoint. SENTRY hits it directly with the attack suite.",
    badge: "Available",
    avail: true,
  },
  {
    id: "web_url",
    Icon: Globe,
    name: "Live web chat",
    desc: "Paste your client's website URL — SENTRY uses Playwright to drive the chat widget in headless mode and pen-test it.",
    badge: "Coming soon",
    avail: false,
  },
  {
    id: "whatsapp",
    Icon: MessageCircle,
    name: "WhatsApp Business",
    desc: "Requires Twilio / 360dialog / Meta WABA + approved business number. SENTRY sends the attack suite to your bot via the WABA pipeline.",
    badge: "Coming soon",
    avail: false,
  },
  {
    id: "facebook",
    Icon: MessagesSquare,
    name: "Facebook Messenger",
    desc: "Requires a Page Access Token and Meta App. SENTRY attacks your bot through the Graph API.",
    badge: "Coming soon",
    avail: false,
  },
];

export default function ConnectPage() {
  const [channel, setChannel] = useState<Channel>("proxy");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("Banking");
  const [icon, setIcon] = useState("🏦");
  const [desc, setDesc] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [website, setWebsite] = useState("");
  const [upstream, setUpstream] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [status, setStatus] = useState("Ready.");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; data?: Registered; err?: string } | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      alert("Please give the agent a name.");
      return;
    }
    setSubmitting(true);
    setStatus("Registering…");
    setResult(null);
    try {
      const r = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          vertical,
          icon,
          description: desc,
          connection: channel,
          endpoint_url: endpoint || website || null,
          upstream_provider: channel === "proxy" ? upstream : null,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t.slice(0, 200));
      }
      const d = (await r.json()) as Registered;
      setResult({ ok: true, data: d });
    } catch (e) {
      const err = e instanceof Error ? e.message : "Unknown error";
      setResult({ ok: false, err });
    } finally {
      setSubmitting(false);
      setStatus("Ready.");
    }
  };

  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">Onboard a new AI agent</div>
          <h1 className="arch-hero-title">Connect any chatbot, voice agent, or LLM API</h1>
          <p className="arch-hero-sub">
            Pick how your agent reaches its end users. SENTRY supports drop-in proxy mode, raw HTTP
            endpoint testing, web chat-widget scanning, and (coming soon) WhatsApp Business + Facebook
            Messenger.
          </p>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card"><div className="metric-val">5</div><div className="metric-lbl">Channels supported</div></div>
          <div className="metric-card"><div className="metric-val">~30 s</div><div className="metric-lbl">Time to register</div></div>
          <div className="metric-card"><div className="metric-val">12+</div><div className="metric-lbl">Attacks ready to fire</div></div>
          <div className="metric-card"><div className="metric-val">5</div><div className="metric-lbl">Regulations covered</div></div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Step 1 · Agent identity</h2>
          <p className="muted">
            Give the agent a memorable name. This is how it'll appear in dashboards and tickets.
          </p>
        </div>
        <div className="cn-row">
          <label>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ACME Bank · loan-decision bot"
            />
          </label>
          <label>
            <span>Vertical</span>
            <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
              <option>Banking</option>
              <option>Insurance</option>
              <option>Healthcare</option>
              <option>Public sector</option>
              <option>Retail</option>
              <option>Telco</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            <span>Icon</span>
            <select value={icon} onChange={(e) => setIcon(e.target.value)}>
              <option>🏦</option>
              <option>🛡️</option>
              <option>🏥</option>
              <option>🏛️</option>
              <option>🛒</option>
              <option>📞</option>
              <option>🤖</option>
              <option>💼</option>
            </select>
          </label>
        </div>
        <label className="cn-full">
          <span>Short description (optional)</span>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What this agent does, regulatory profile, any context for the audit team…"
          />
        </label>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Step 2 · How does it reach end users?</h2>
          <p className="muted">Pick the channel. Each option configures SENTRY's interception strategy.</p>
        </div>
        <div className="cn-channel-grid">
          {CHANNELS.map((c) => {
            const Icon = c.Icon;
            return (
              <button
                key={c.id}
                className={`cn-channel ${channel === c.id ? "selected" : ""}`}
                onClick={() => setChannel(c.id)}
              >
                <div className="cn-ch-icon">
                  <Icon size={24} />
                </div>
                <div className="cn-ch-name">{c.name}</div>
                <div className="cn-ch-desc">{c.desc}</div>
                <div className={`cn-ch-badge ${c.avail ? "avail" : "soon"}`}>{c.badge}</div>
              </button>
            );
          })}
        </div>

        {channel === "proxy" && (
          <div className="cn-channel-config">
            <p className="muted">
              When you save, SENTRY will give you a personalised proxy URL. Point your client's{" "}
              <code>base_url</code> there — every call is then audited live.
            </p>
            <label>
              <span>Upstream provider</span>
              <select value={upstream} onChange={(e) => setUpstream(e.target.value as typeof upstream)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </label>
          </div>
        )}
        {channel === "http" && (
          <div className="cn-channel-config">
            <label>
              <span>HTTP endpoint URL</span>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.client.com/chatbot/v1/message"
              />
            </label>
            <p className="muted small">
              SENTRY POSTs <code>{`{ "prompt": "..." }`}</code> to this URL with your auth header, treats the body as the bot's reply.
            </p>
          </div>
        )}
        {channel === "web_url" && (
          <div className="cn-channel-config">
            <label>
              <span>Public site URL (where the chat widget lives)</span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://client-website.com/contact"
              />
            </label>
            <p className="muted small">
              Coming soon — Playwright will scan the page for a chat widget and drive it headless.
            </p>
          </div>
        )}
        {channel === "whatsapp" && (
          <div className="cn-channel-config">
            <p className="muted">
              Coming soon. Will require: WhatsApp Business API provider (Twilio / 360dialog / Meta
              WABA), business number, system-user access token.
            </p>
          </div>
        )}
        {channel === "facebook" && (
          <div className="cn-channel-config">
            <p className="muted">
              Coming soon. Will require: Facebook App ID + secret, Page Access Token, page subscribed
              to messaging webhook.
            </p>
          </div>
        )}
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Step 3 · Register & start</h2>
          <p className="muted">
            When you click below, the agent shows up in the catalog. You can run Red Team against it
            immediately.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="rt-run-btn"
            disabled={submitting}
            onClick={submit}
            style={{ background: "linear-gradient(135deg,var(--blue-500),var(--blue-700))" }}
          >
            ✓ Register agent
          </button>
          <span className="muted small">{status}</span>
        </div>
        {result && result.ok && result.data && (
          <div className={`cn-result ${result.data.pending ? "error" : ""}`}>
            <h3>{result.data.pending ? "🟡 Saved · channel in beta" : "✅ Agent registered"}</h3>
            {result.data.pending ? (
              <p>
                The channel "<strong>{channel}</strong>" is in beta. The agent has been registered as{" "}
                <code>{result.data.agent_id}</code> and will be activated when that channel ships.
              </p>
            ) : (
              <p>
                Agent registered as <code>{result.data.agent_id}</code>. {result.data.next_step || ""}
              </p>
            )}
            {(result.data.proxy_endpoint || channel === "proxy") && (
              <>
                <p><strong>Your proxy endpoint:</strong></p>
                <code>{(typeof window !== "undefined" ? window.location.origin : "")}/api/v1/chat/completions</code>
                <p className="muted small">
                  Point your OpenAI client's <code>base_url</code> there. SENTRY audits every call inline.
                </p>
              </>
            )}
            <div className="cn-result-actions">
              <Link href={`/agent?id=${result.data.agent_id}`}>📊 View agent profile</Link>
              {!result.data.pending && (
                <Link href={`/redteam?prefill=${result.data.agent_id}`}>⚡ Run Red Team now</Link>
              )}
              <Link href="/connect">➕ Register another</Link>
            </div>
          </div>
        )}
        {result && !result.ok && (
          <div className="cn-result error">
            <h3>❌ Registration failed</h3>
            <p>{result.err}</p>
          </div>
        )}
      </section>
    </div>
  );
}
