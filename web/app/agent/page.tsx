"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../lib/api";
import { REG_LABELS, REG_COLORS } from "../lib/constants";
import "../architecture/architecture.css";
import "../redteam/redteam.css";
import "../connect/connect.css";
import "../playground/playground.css";

type AgentDetails = {
  agent: {
    id: string;
    name: string;
    icon: string;
    vertical: string;
    description?: string;
    status?: string;
  };
  stats: {
    total_interactions: number;
    by_severity: Record<string, number>;
    by_regulation: Record<string, number>;
  };
  recent_interactions: Array<{
    interaction_id: string;
    created_at: string;
    severity: "critical" | "warning" | "advisory";
    channel: string;
    request?: string;
    response?: string;
    action_taken: string;
  }>;
};

export default function AgentPage() {
  const params = useSearchParams();
  const id = params.get("id");
  const [data, setData] = useState<AgentDetails | null | "missing">(null);

  useEffect(() => {
    if (!id) {
      setData("missing");
      return;
    }
    api<AgentDetails>(`/api/agents/${id}/details`).then((d) => {
      setData(d ?? "missing");
    });
  }, [id]);

  if (data === null) {
    return (
      <div className="arch-main">
        <section className="arch-hero">
          <div className="arch-hero-text">
            <div className="pg-hero-eyebrow">Agent profile</div>
            <h1 className="arch-hero-title">Loading agent…</h1>
          </div>
        </section>
      </div>
    );
  }

  if (data === "missing") {
    return (
      <div className="arch-main">
        <section className="arch-hero">
          <div className="arch-hero-text">
            <h1 className="arch-hero-title">
              {id ? "Could not load agent" : "No agent ID provided"}
            </h1>
            <p className="arch-hero-sub">
              <Link href="/redteam">← Back to Red Team</Link>
            </p>
          </div>
        </section>
      </div>
    );
  }

  const a = data.agent;
  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">{a.vertical || "Agent"}</div>
          <h1 className="arch-hero-title">
            {a.icon || "🤖"} {a.name}
          </h1>
          <p className="arch-hero-sub">
            {a.description || `Audited by SENTRY. ${data.stats.total_interactions} interactions seen.`}
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={`/redteam?prefill=${id}`}
              className="rt-run-btn"
              style={{
                background: "linear-gradient(135deg,var(--red),#7a0014)",
                color: "white",
                textDecoration: "none",
              }}
            >
              ⚡ Run Red Team on this agent
            </Link>
            <Link href="/tickets" className="rt-export-btn">
              📋 View tickets
            </Link>
          </div>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card">
            <div className="metric-val">{data.stats.total_interactions}</div>
            <div className="metric-lbl">Total interactions</div>
          </div>
          <div className="metric-card">
            <div className="metric-val" style={{ color: "#fca5a5" }}>
              {data.stats.by_severity.critical || 0}
            </div>
            <div className="metric-lbl">Criticals caught</div>
          </div>
          <div className="metric-card">
            <div className="metric-val" style={{ color: "#fcd34d" }}>
              {data.stats.by_severity.warning || 0}
            </div>
            <div className="metric-lbl">Warnings</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">
              {data.stats.total_interactions > 0 ? "active" : "idle"}
            </div>
            <div className="metric-lbl">Status</div>
          </div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Violations breakdown</h2>
          <p className="muted">Findings caught against this agent, grouped by regulation.</p>
        </div>
        <div className="ag-reg-grid">
          {Object.entries(data.stats.by_regulation).length === 0 ? (
            <div className="muted" style={{ padding: 14 }}>
              No findings yet against this agent.
            </div>
          ) : (
            Object.entries(data.stats.by_regulation).map(([reg, count]) => (
              <div
                key={reg}
                className="ag-reg-item"
                style={{ borderLeftColor: REG_COLORS[reg] || "#888" }}
              >
                <div className="ag-reg-name">{REG_LABELS[reg] || reg}</div>
                <div className="ag-reg-count">{count}</div>
                <div className="ag-reg-sub">findings</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Recent interactions</h2>
          <p className="muted">
            Last 50 audited exchanges for this agent. Click any row for the full forensic detail.
          </p>
        </div>
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
              {data.recent_interactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 24, textAlign: "center" }}>
                    No interactions audited yet for this agent.
                  </td>
                </tr>
              ) : (
                data.recent_interactions.map((i) => (
                  <tr
                    key={i.interaction_id}
                    style={{ cursor: "pointer" }}
                    onClick={() => window.open(`/api/reports/${i.interaction_id}`, "_blank")}
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
                    <td className="snippet-cell">{i.request || ""}</td>
                    <td className="snippet-cell">{i.response || ""}</td>
                    <td className={`action-cell ${i.action_taken}`}>{i.action_taken}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
