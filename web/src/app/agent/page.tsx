"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import { apiGet, apiUrl } from "@/lib/api";
import { REG_LABELS, REG_COLORS } from "@/lib/format";

interface AgentInfo {
  id: string;
  name: string;
  icon?: string;
  vertical?: string;
  description?: string;
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
  agent: AgentInfo;
  stats: {
    total_interactions: number;
    by_severity: Record<string, number>;
    by_regulation: Record<string, number>;
  };
  recent_interactions: AgentInteraction[];
}

export default function AgentPage() {
  const params = useSearchParams();
  const agentId = params.get("id");
  const [data, setData] = useState<AgentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    apiGet<AgentDetails>(`/agents/${agentId}/details`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [agentId]);

  return (
    <>
      <Topbar pageKey="agent" />
      <main className="arch-main">
        <section className="arch-hero">
          <div className="arch-hero-text">
            <div className="pg-hero-eyebrow">{data?.agent.vertical ?? "Agent"}</div>
            <h1 className="arch-hero-title">
              {!agentId
                ? "No agent ID provided"
                : error
                ? "Could not load agent"
                : data
                ? `${data.agent.icon ?? "🤖"}  ${data.agent.name}`
                : "Loading agent…"}
            </h1>
            <p className="arch-hero-sub">
              {error
                ? error
                : data?.agent.description ??
                  (data ? `Audited by SENTRY. ${data.stats.total_interactions} interactions seen.` : "")}
            </p>
            {data && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  className="rt-run-btn"
                  style={{ background: "linear-gradient(135deg, var(--red), #7a0014)", color: "white" }}
                  href={`/redteam?prefill=${agentId}`}
                >
                  ⚡ Run Red Team on this agent
                </a>
                <a className="rt-export-btn" href="/tickets">
                  📋 View tickets
                </a>
              </div>
            )}
          </div>
          <div className="arch-hero-metrics">
            <div className="metric-card"><div className="metric-val">{data?.stats.total_interactions ?? 0}</div><div className="metric-lbl">Total interactions</div></div>
            <div className="metric-card"><div className="metric-val" style={{ color: "#fca5a5" }}>{data?.stats.by_severity.critical ?? 0}</div><div className="metric-lbl">Criticals caught</div></div>
            <div className="metric-card"><div className="metric-val" style={{ color: "#fcd34d" }}>{data?.stats.by_severity.warning ?? 0}</div><div className="metric-lbl">Warnings</div></div>
            <div className="metric-card"><div className="metric-val">{data ? (data.stats.total_interactions > 0 ? "active" : "idle") : "—"}</div><div className="metric-lbl">Status</div></div>
          </div>
        </section>

        <Card className="arch-card" title="Violations breakdown" subtitle="Findings caught against this agent, grouped by regulation.">
          <div className="ag-reg-grid">
            {!data && <div className="muted">Loading…</div>}
            {data && Object.entries(data.stats.by_regulation).length === 0 && (
              <div className="muted" style={{ padding: 14 }}>
                No findings yet against this agent.
              </div>
            )}
            {data &&
              Object.entries(data.stats.by_regulation).map(([reg, count]) => (
                <div key={reg} className="ag-reg-item" style={{ borderLeftColor: REG_COLORS[reg] ?? "#888" }}>
                  <div className="ag-reg-name">{REG_LABELS[reg] ?? reg}</div>
                  <div className="ag-reg-count">{count}</div>
                  <div className="ag-reg-sub">findings</div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="arch-card" title="Recent interactions" subtitle="Last 50 audited exchanges for this agent. Click any row for the full forensic detail.">
          <div className="feed-table-wrap">
            <table className="feed-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Channel</th>
                  <th>User said</th>
                  <th>Bot replied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!data && (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 24, textAlign: "center" }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {data && data.recent_interactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 24, textAlign: "center" }}>
                      No interactions audited yet for this agent.
                    </td>
                  </tr>
                )}
                {data?.recent_interactions.map((i) => (
                  <tr
                    key={i.interaction_id}
                    style={{ cursor: "pointer" }}
                    onClick={() => window.open(apiUrl(`/reports/${i.interaction_id}`), "_blank")}
                  >
                    <td className="time-cell">
                      {new Date(i.created_at).toLocaleString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td>
                      <span className={`sev-pill ${i.severity}`}>{i.severity}</span>
                    </td>
                    <td>{i.channel}</td>
                    <td className="snippet-cell">{i.request}</td>
                    <td className="snippet-cell">{i.response}</td>
                    <td className={`action-cell ${i.action_taken}`}>{i.action_taken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
