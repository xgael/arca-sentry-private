"use client";

/**
 * ARCA SENTRY — Agents (unified CRUD).
 * Default: a list of registered agents.
 * `?new=1`     → opens the Connect wizard in a centered modal.
 * `?id=<aid>`  → opens that agent's profile in a right-side drawer.
 * Both overlays mount inline so navigation between list + create + view feels
 * like the same page (Linear / Vercel pattern), not three separate routes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";

import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import { apiGet, apiPost, apiUrl } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { REG_LABELS, REG_COLORS } from "@/lib/format";

/* ─────────────── Types ─────────────── */
interface AgentCard {
  id: string;
  name: string;
  icon: string;
  vertical: string;
  status: string;
  description: string;
  model?: string;
  total_audits: number;
  warnings_caught: number;
  criticals_caught: number;
  last_audited_at?: string | null;
}

interface AgentInteraction {
  interaction_id: string;
  created_at: string;
  severity: "advisory" | "warning" | "critical";
  channel: string;
  request: string;
  response: string;
  action_taken: "allow" | "warn" | "block";
}

interface AgentDetails {
  agent: { id: string; name: string; icon?: string; vertical?: string; description?: string };
  stats: {
    total_interactions: number;
    by_severity: Record<string, number>;
    by_regulation: Record<string, number>;
  };
  recent_interactions: AgentInteraction[];
}

type Channel = "proxy" | "http" | "web_url" | "whatsapp" | "facebook";

interface RegisterResponse {
  agent_id: string;
  pending?: boolean;
  next_step?: string;
  proxy_endpoint?: string;
}

const CHANNELS: Array<{ key: Channel; icon: string; name: string; desc: string; badge: "avail" | "soon" }> = [
  { key: "proxy", icon: "🔌", name: "Proxy mode", desc: "Drop-in for OpenAI / Anthropic / Gemini SDKs. Change one line, you're protected.", badge: "avail" },
  { key: "http", icon: "📡", name: "HTTP endpoint", desc: "Your bot exposes a REST endpoint. SENTRY hits it directly with the attack suite.", badge: "avail" },
  { key: "web_url", icon: "🌐", name: "Live web chat", desc: "Paste your client's website URL — SENTRY drives the chat widget in headless mode and pen-tests it.", badge: "soon" },
  { key: "whatsapp", icon: "💬", name: "WhatsApp Business", desc: "Requires Twilio / 360dialog / Meta WABA + approved business number.", badge: "soon" },
  { key: "facebook", icon: "📘", name: "Facebook Messenger", desc: "Requires a Page Access Token and Meta App.", badge: "soon" },
];

/* ─────────────── Page ─────────────── */

export default function AgentsPage() {
  const params = useSearchParams();
  const router = useRouter();

  const [agents, setAgents] = useState<AgentCard[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const d = await apiGet<{ agents: AgentCard[] }>("/agents");
      setAgents(d.agents ?? []);
    } catch {
      setAgents([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // URL params → overlay state (deep-linkable)
  useEffect(() => {
    setShowWizard(params.get("new") === "1");
    setOpenId(params.get("id"));
  }, [params]);

  const openProfile = useCallback((id: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("id", id);
    sp.delete("new");
    router.replace(`/agents?${sp.toString()}`);
  }, [params, router]);

  const closeProfile = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("id");
    router.replace(sp.toString() ? `/agents?${sp.toString()}` : "/agents");
  }, [params, router]);

  const openWizard = useCallback(() => {
    router.replace("/agents?new=1");
  }, [router]);

  const closeWizard = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("new");
    router.replace(sp.toString() ? `/agents?${sp.toString()}` : "/agents");
  }, [params, router]);

  return (
    <>
      <Topbar pageKey="agents" />
      <main className="arch-main">
        <div className="page-head">
          <div className="page-head-row">
            <div>
              <h1>Agents</h1>
              <p className="muted">
                AI agents registered with SENTRY. Each row is one bot being audited.
                Click any row for the profile; use “Connect agent” to onboard a new one.
              </p>
            </div>
            <div className="page-head-actions">
              <button type="button" className="btn-primary" onClick={openWizard}>
                <Plus className="icon-svg" /> Connect agent
              </button>
            </div>
          </div>
        </div>

        <Card className="arch-card">
          {agents === null && (
            <div className="agents-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-card">
                  <span className="skeleton-line w-third" />
                  <span className="skeleton-line h-tall w-half" />
                  <span className="skeleton-line w-two-thirds" />
                </div>
              ))}
            </div>
          )}
          {agents !== null && agents.length === 0 && (
            <div className="list-empty">
              <div className="list-empty-mark">🤖</div>
              <div className="list-empty-title">No agents yet</div>
              <div className="list-empty-desc">
                Register your first AI agent so SENTRY can audit and pen-test it. Drop-in proxy mode takes ~30 seconds.
              </div>
              <button type="button" className="list-empty-cta" onClick={openWizard}>
                <Plus className="icon-svg" /> Connect your first agent
              </button>
            </div>
          )}
          {agents !== null && agents.length > 0 && (
            <div className="agents-list">
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="agent-list-row"
                  onClick={() => openProfile(a.id)}
                >
                  <div className="agent-list-avatar">{a.icon || "🤖"}</div>
                  <div className="agent-list-meta">
                    <div className="agent-list-name">{a.name}</div>
                    <div className="agent-list-sub">
                      {a.vertical} · {a.model ?? "—"}
                    </div>
                  </div>
                  <div className="agent-list-stats">
                    <span><strong>{a.total_audits}</strong> audits</span>
                    <span>
                      <strong style={{ color: a.criticals_caught > 0 ? "var(--red)" : undefined }}>
                        {a.criticals_caught}
                      </strong> critical
                    </span>
                    <span>
                      <strong style={{ color: a.warnings_caught > 0 ? "var(--amber)" : undefined }}>
                        {a.warnings_caught}
                      </strong> warning
                    </span>
                  </div>
                  <div className="agent-list-arrow">→</div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </main>

      {showWizard && (
        <ConnectWizard
          onClose={closeWizard}
          onRegistered={async (newId) => {
            await refresh();
            closeWizard();
            openProfile(newId);
          }}
        />
      )}

      {openId && <AgentDrawer agentId={openId} onClose={closeProfile} />}

      <footer className="footer">© ARCA SENTRY</footer>
    </>
  );
}

/* ─────────────── Connect Wizard (modal) ─────────────── */

function ConnectWizard({ onClose, onRegistered }: { onClose: () => void; onRegistered: (id: string) => void | Promise<void> }) {
  const [channel, setChannel] = useState<Channel>("proxy");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("Banking");
  const [icon, setIcon] = useState("🏦");
  const [desc, setDesc] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [website, setWebsite] = useState("");
  const [upstream, setUpstream] = useState("openai");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (!name.trim()) { toast.warning("Missing name", "Please give the agent a name."); return; }
    setSubmitting(true);
    try {
      const r = await toast.promise(
        apiPost<RegisterResponse>("/agents/register", {
          name: name.trim(), vertical, icon, description: desc.trim(),
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
          error: (err) => ({ title: "Registration failed", description: err instanceof Error ? err.message : String(err) }),
        },
      );
      await onRegistered(r.agent_id);
    } catch {/* error toast already shown */}
    finally { setSubmitting(false); }
  }

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-modal connect-modal" onClick={(e) => e.stopPropagation()}>
        <header className="overlay-head">
          <div>
            <h2>Connect agent</h2>
            <p className="muted small">Register a new AI agent so SENTRY can audit and pen-test it.</p>
          </div>
          <button type="button" className="overlay-close" onClick={onClose} aria-label="Close">
            <X className="icon-svg" />
          </button>
        </header>

        <div className="overlay-body">
          <Card className="arch-card" title="Step 1 · Agent identity" subtitle="Give it a memorable name. This is how it'll appear in dashboards and tickets.">
            <div className="cn-row">
              <label><span>Name</span>
                <input type="text" placeholder="e.g. ACME Bank · loan-decision bot" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label><span>Vertical</span>
                <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
                  {["Banking", "Insurance", "Healthcare", "Public sector", "Retail", "Telco", "Other"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label><span>Icon</span>
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
                <button key={c.key} type="button" className={`cn-channel ${channel === c.key ? "selected" : ""}`} onClick={() => setChannel(c.key)}>
                  <div className="cn-ch-icon">{c.icon}</div>
                  <div className="cn-ch-name">{c.name}</div>
                  <div className="cn-ch-desc">{c.desc}</div>
                  <div className={`cn-ch-badge ${c.badge}`}>{c.badge === "avail" ? "Available" : "Coming soon"}</div>
                </button>
              ))}
            </div>

            {channel === "proxy" && (
              <div className="cn-channel-config">
                <p className="muted">When you save, SENTRY gives you a personalised proxy URL. Point your client&apos;s <code>base_url</code> there — every call is then audited live.</p>
                <label><span>Upstream provider</span>
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
                <label><span>HTTP endpoint URL</span>
                  <input type="url" placeholder="https://api.client.com/chatbot/v1/message" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
                </label>
              </div>
            )}
            {channel === "web_url" && (
              <div className="cn-channel-config">
                <label><span>Public site URL</span>
                  <input type="url" placeholder="https://client-website.com/contact" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
                <p className="muted small">Coming soon — Playwright will drive the widget headless.</p>
              </div>
            )}
            {channel === "whatsapp" && <div className="cn-channel-config"><p className="muted">Coming soon. WABA + system-user token required.</p></div>}
            {channel === "facebook" && <div className="cn-channel-config"><p className="muted">Coming soon. Facebook App + Page Access Token required.</p></div>}
          </Card>
        </div>

        <footer className="overlay-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
            ✓ Register agent
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────── Agent Drawer ─────────────── */

function AgentDrawer({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const [data, setData] = useState<AgentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null); setError(null);
    apiGet<AgentDetails>(`/agents/${agentId}/details`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [agentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop open" onClick={onClose} />
      <aside className="drawer agents-drawer open" role="dialog" aria-modal="true">
        <div className="drawer-head" style={{ background: "linear-gradient(135deg, #ffffff, var(--blue-50))" }}>
          <div>
            <div className="drawer-title" style={{ color: "var(--ink)" }}>
              {error ? "Could not load agent" : data ? `${data.agent.icon ?? "🤖"}  ${data.agent.name}` : "Loading…"}
            </div>
            <div className="drawer-subtitle">{data?.agent.vertical ?? agentId}</div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X className="icon-svg" />
          </button>
        </div>
        <div className="drawer-body">
          {error && <div className="muted">{error}</div>}
          {data && (
            <>
              {data.agent.description && (
                <p className="muted" style={{ marginBottom: 16 }}>{data.agent.description}</p>
              )}
              <div className="page-head-metrics" style={{ marginBottom: 22 }}>
                <div><strong>{data.stats.total_interactions}</strong> interactions</div>
                <div><strong style={{ color: "var(--red)" }}>{data.stats.by_severity.critical ?? 0}</strong> criticals</div>
                <div><strong style={{ color: "var(--amber)" }}>{data.stats.by_severity.warning ?? 0}</strong> warnings</div>
              </div>

              <div className="drawer-section">
                <h3>Violations breakdown</h3>
                {Object.entries(data.stats.by_regulation).length === 0 ? (
                  <div className="muted small">No findings yet. Run Red Team to probe actively.</div>
                ) : (
                  <div className="ag-reg-grid">
                    {Object.entries(data.stats.by_regulation).map(([reg, count]) => (
                      <div key={reg} className="ag-reg-item" style={{ borderLeftColor: REG_COLORS[reg] ?? "#888" }}>
                        <div className="ag-reg-name">{REG_LABELS[reg] ?? reg}</div>
                        <div className="ag-reg-count">{count}</div>
                        <div className="ag-reg-sub">findings</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="drawer-section">
                <h3>Recent interactions ({data.recent_interactions.length})</h3>
                {data.recent_interactions.length === 0 ? (
                  <div className="muted small">No audited exchanges yet.</div>
                ) : (
                  <div className="feed-table-wrap">
                    <table className="feed-table">
                      <thead>
                        <tr><th>Time</th><th>Sev</th><th>Channel</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {data.recent_interactions.slice(0, 20).map((i) => (
                          <tr
                            key={i.interaction_id}
                            style={{ cursor: "pointer" }}
                            onClick={() => window.open(apiUrl(`/reports/${i.interaction_id}`), "_blank")}
                          >
                            <td className="time-cell">
                              {new Date(i.created_at).toLocaleTimeString("en-GB")}
                            </td>
                            <td><span className={`sev-pill ${i.severity}`}>{i.severity}</span></td>
                            <td>{i.channel}</td>
                            <td className={`action-cell ${i.action_taken}`}>{i.action_taken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="drawer-links">
                <a href={`/redteam?prefill=${agentId}`}>⚡ Run Red Team</a>
                <a href="/tickets">📋 View tickets</a>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
