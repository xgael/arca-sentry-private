"use client";

import { useState } from "react";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import { apiPost } from "@/lib/api";
import { toast } from "@/components/ui/toast";

type Channel = "proxy" | "http" | "web_url" | "whatsapp" | "facebook";

interface RegisterResponse {
  agent_id: string;
  pending?: boolean;
  next_step?: string;
  proxy_endpoint?: string;
}

const CHANNELS: Array<{
  key: Channel;
  icon: string;
  name: string;
  desc: string;
  badge: "avail" | "soon";
}> = [
  { key: "proxy", icon: "🔌", name: "Proxy mode", desc: "Drop-in for OpenAI / Anthropic / Gemini SDKs. Change one line, you're protected.", badge: "avail" },
  { key: "http", icon: "📡", name: "HTTP endpoint", desc: "Your bot exposes a REST endpoint. SENTRY hits it directly with the attack suite.", badge: "avail" },
  { key: "web_url", icon: "🌐", name: "Live web chat", desc: "Paste your client's website URL — SENTRY uses Playwright to drive the chat widget in headless mode and pen-test it.", badge: "soon" },
  { key: "whatsapp", icon: "💬", name: "WhatsApp Business", desc: "Requires Twilio / 360dialog / Meta WABA + approved business number. SENTRY sends the attack suite to your bot via the WABA pipeline.", badge: "soon" },
  { key: "facebook", icon: "📘", name: "Facebook Messenger", desc: "Requires a Page Access Token and Meta App. SENTRY attacks your bot through the Graph API.", badge: "soon" },
];

export default function ConnectPage() {
  const [channel, setChannel] = useState<Channel>("proxy");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("Banking");
  const [icon, setIcon] = useState("🏦");
  const [desc, setDesc] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [website, setWebsite] = useState("");
  const [upstream, setUpstream] = useState("openai");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [result, setResult] = useState<{ ok: boolean; html: string } | null>(null);

  async function submit() {
    if (!name.trim()) {
      toast.warning("Missing name", "Please give the agent a name.");
      return;
    }
    setSubmitting(true);
    setStatus("Registering…");
    setResult(null);
    try {
      const r = await toast.promise(
        apiPost<RegisterResponse>("/agents/register", {
          name: name.trim(),
          vertical,
          icon,
          description: desc.trim(),
          connection: channel,
          endpoint_url: endpoint || website || null,
          upstream_provider: channel === "proxy" ? upstream : null,
        }),
        {
          loading: { title: `Registering ${name.trim()}…`, description: "Provisioning audit pipeline" },
          success: (data) => ({
            title: data.pending ? "Saved · channel in beta" : "Agent registered",
            description: data.pending
              ? `Registered as ${data.agent_id}; activates when ${channel} ships.`
              : `Registered as ${data.agent_id}`,
          }),
          error: (err) => ({
            title: "Registration failed",
            description: err instanceof Error ? err.message : String(err),
          }),
        },
      );
      // Result now lives in the toast (title, id, next step). The card below
      // is reduced to a strip of next-step CTAs — no duplicated copy.
      const url = typeof window !== "undefined" ? `${window.location.origin}/v1/chat/completions` : "";
      const showProxy = r.proxy_endpoint || channel === "proxy";
      const html = `
        <div class="cn-result-actions">
          <a href="/agent?id=${r.agent_id}">📊 View agent profile</a>
          ${!r.pending ? `<a href="/redteam?prefill=${r.agent_id}">⚡ Run Red Team now</a>` : ""}
          <a href="/connect">➕ Register another</a>
        </div>
        ${showProxy ? `<code class="cn-proxy-endpoint">${url}</code>
           <p class="muted small" style="margin-top:6px;">Point your OpenAI client's <code>base_url</code> at this URL.</p>` : ""}
      `;
      setResult({ ok: !r.pending, html });
    } catch (e) {
      // Error toast is already shown by toast.promise(); skip the card.
      void e;
    } finally {
      setSubmitting(false);
      setStatus("Ready.");
    }
  }

  return (
    <>
      <Topbar pageKey="connect" />
      <main className="arch-main">
        <div className="page-head">
          <h1>Connect agent</h1>
          <p className="muted">Register a new AI agent so SENTRY can audit and pen-test it.</p>
        </div>

        <Card className="arch-card" title="Step 1 · Agent identity" subtitle="Give the agent a memorable name. This is how it'll appear in dashboards and tickets.">
          <div className="cn-row">
            <label>
              <span>Name</span>
              <input type="text" placeholder="e.g. ACME Bank · loan-decision bot" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <span>Vertical</span>
              <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
                {["Banking", "Insurance", "Healthcare", "Public sector", "Retail", "Telco", "Other"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label>
              <span>Icon</span>
              <select value={icon} onChange={(e) => setIcon(e.target.value)}>
                {["🏦", "🛡️", "🏥", "🏛️", "🛒", "📞", "🤖", "💼"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
          </div>
          <label className="cn-full">
            <span>Short description (optional)</span>
            <textarea rows={2} placeholder="What this agent does, regulatory profile, any context for the audit team…" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
        </Card>

        <Card className="arch-card" title="Step 2 · How does it reach end users?" subtitle="Pick the channel. Each option configures SENTRY's interception strategy.">
          <div className="cn-channel-grid">
            {CHANNELS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`cn-channel ${channel === c.key ? "selected" : ""}`}
                onClick={() => setChannel(c.key)}
              >
                <div className="cn-ch-icon">{c.icon}</div>
                <div className="cn-ch-name">{c.name}</div>
                <div className="cn-ch-desc">{c.desc}</div>
                <div className={`cn-ch-badge ${c.badge}`}>{c.badge === "avail" ? "Available" : "Coming soon"}</div>
              </button>
            ))}
          </div>

          {channel === "proxy" && (
            <div className="cn-channel-config">
              <p className="muted">When you save, SENTRY will give you a personalised proxy URL. Point your client&apos;s <code>base_url</code> there — every call is then audited live.</p>
              <label>
                <span>Upstream provider</span>
                <select value={upstream} onChange={(e) => setUpstream(e.target.value)}>
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
                <input type="url" placeholder="https://api.client.com/chatbot/v1/message" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
              </label>
              <p className="muted small">SENTRY POSTs <code>{`{ "prompt": "..." }`}</code> to this URL with your auth header, treats the body as the bot&apos;s reply.</p>
            </div>
          )}
          {channel === "web_url" && (
            <div className="cn-channel-config">
              <label>
                <span>Public site URL (where the chat widget lives)</span>
                <input type="url" placeholder="https://client-website.com/contact" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
              <p className="muted small">Coming soon — Playwright will scan the page for a chat widget and drive it headless.</p>
            </div>
          )}
          {channel === "whatsapp" && (
            <div className="cn-channel-config">
              <p className="muted">Coming soon. Will require: WhatsApp Business API provider (Twilio / 360dialog / Meta WABA), business number, system-user access token.</p>
            </div>
          )}
          {channel === "facebook" && (
            <div className="cn-channel-config">
              <p className="muted">Coming soon. Will require: Facebook App ID + secret, Page Access Token, page subscribed to messaging webhook.</p>
            </div>
          )}
        </Card>

        <Card className="arch-card" title="Step 3 · Register & start" subtitle="When you click below, the agent shows up in the catalog. You can run Red Team against it immediately.">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="rt-run-btn"
              style={{ background: "linear-gradient(135deg, var(--blue-500), var(--blue-700))" }}
              onClick={submit}
              disabled={submitting}
            >
              ✓ Register agent
            </button>
            <span className="muted small">{status}</span>
          </div>
          {result && (
            <div
              className={`cn-result ${result.ok ? "" : "error"}`}
              style={{ display: "block" }}
              dangerouslySetInnerHTML={{ __html: result.html }}
            />
          )}
        </Card>
      </main>

      <footer className="footer">
        © ARCA SENTRY
      </footer>
    </>
  );
}
