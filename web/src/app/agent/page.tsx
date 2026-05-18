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
        <div className="page-head">
          <div className="page-head-row">
            <div>
              <div className="page-eyebrow">{data?.agent.vertical ?? "Agent"}</div>
              <h1>
                {!agentId
                  ? "No agent ID provided"
                  : error
                  ? "Could not load agent"
                  : data
                  ? `${data.agent.icon ?? "🤖"}  ${data.agent.name}`
                  : "Loading agent…"}
              </h1>
              <p className="muted">
                {error
                  ? error
                  : data?.agent.description ??
                    (data ? `${data.stats.total_interactions} interactions audited.` : "")}
              </p>
            </div>
            {data && (
              <div className="page-head-actions">
                <a className="btn-danger" href={`/redteam?prefill=${agentId}`}>⚡ Run Red Team</a>
                <a className="btn-secondary" href="/tickets">📋 View tickets</a>
              </div>
            )}
          </div>

          {data && (
            <div className="page-head-metrics">
              <div><strong>{data.stats.total_interactions}</strong> interactions</div>
              <div><strong style={{ color: "var(--red)" }}>{data.stats.by_severity.critical ?? 0}</strong> criticals</div>
              <div><strong style={{ color: "var(--amber)" }}>{data.stats.by_severity.warning ?? 0}</strong> warnings</div>
              <div><strong>{data.stats.total_interactions > 0 ? "active" : "idle"}</strong></div>
            </div>
          )}
        </div>

        <Card className="arch-card" title="Violations breakdown" subtitle="Findings caught against this agent, grouped by regulation.">
          <div className="ag-reg-grid">
            {!data && !error && (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ag-reg-item">
                    <span className="skeleton-line w-half" />
                    <span className="skeleton-line h-tall w-third" style={{ marginTop: 8 }} />
                  </div>
                ))}
              </>
            )}
            {data && Object.entries(data.stats.by_regulation).length === 0 && (
              <div className="list-empty" style={{ gridColumn: "1 / -1" }}>
                <div className="list-empty-mark">🛡️</div>
                <div className="list-empty-title">No findings yet</div>
                <div className="list-empty-desc">
                  This agent hasn&apos;t triggered any violation. Run Red Team to probe it actively.
                </div>
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
                {!data && !error && (
                  <>
                    {[0, 1, 2, 3].map((i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}><span className="skeleton-line w-two-thirds" /></td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
                {data && data.recent_interactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className="list-empty">
                        <div className="list-empty-mark">📭</div>
                        <div className="list-empty-title">No interactions audited yet</div>
                        <div className="list-empty-desc">
                          This agent hasn&apos;t produced any audited exchange. Send traffic through SENTRY (proxy or /audit) to populate this list.
                        </div>
                      </div>
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
        © ARCA SENTRY
      </footer>
    </>
  );
}
