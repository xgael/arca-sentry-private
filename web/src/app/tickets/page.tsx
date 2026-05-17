"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertOctagon, AlertTriangle, Archive, CheckCircle, Wallet } from "lucide-react";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import { apiGet, apiPost } from "@/lib/api";
import { REG_LABELS } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";

interface TicketSummary {
  open_count: number;
  total_open_exposure_label: string;
  by_status: Record<string, number>;
  total_tickets: number;
}

interface TicketFinding {
  agent: string;
  regulation: string;
  rationale: string;
}

interface TicketRow {
  ticket_id: string;
  interaction_id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  severity: "critical" | "warning" | "advisory";
  regulation: string;
  regulation_long?: string;
  actor: string;
  channel: string;
  created_at: string;
  estimated_exposure_label: string;
  max_fine_label: string;
  user_request: string;
  ai_response: string;
  findings: TicketFinding[];
  remediation_suggestion: string;
}

type StatusFilter = "" | "open" | "in_progress" | "resolved" | "dismissed";

export default function TicketsPage() {
  const { t } = useT();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("");

  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await apiGet<TicketSummary>("/tickets/summary"));
    } catch {/* ignore */}
  }, []);

  const refreshTickets = useCallback(async () => {
    try {
      const q = filter ? `?status=${filter}&limit=100` : "?limit=100";
      const d = await apiGet<{ tickets: TicketRow[] }>(`/tickets${q}`);
      setTickets(d.tickets ?? []);
    } catch {/* ignore */}
  }, [filter]);

  useEffect(() => {
    void refreshSummary();
    void refreshTickets();
    const a = setInterval(refreshSummary, 5000);
    const b = setInterval(refreshTickets, 6000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [refreshSummary, refreshTickets]);

  async function setStatus(iid: string, status: TicketRow["status"]) {
    const prev = tickets.find((tk) => tk.interaction_id === iid)?.status ?? null;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/tickets/${iid}/status?status=${status}`, {
        method: "PATCH",
      });
      await Promise.all([refreshSummary(), refreshTickets()]);
      // Show undo for resolve/dismiss so an accidental click is one tap away.
      if ((status === "resolved" || status === "dismissed") && prev && prev !== status) {
        const label = status === "resolved" ? "resolved" : "dismissed";
        toast.show({
          variant: "success",
          title: `Ticket ${label}`,
          description: "Click undo to revert.",
          icon: status === "resolved" ? "✓" : "✕",
          duration: 6000,
          button: {
            title: "Undo",
            onClick: () => { void setStatus(iid, prev); },
          },
        });
      }
    } catch (e) {
      toast.error("Could not update ticket", e instanceof Error ? e.message : String(e));
    }
  }

  async function regen(iid: string, btn: HTMLButtonElement) {
    btn.disabled = true;
    const original = btn.textContent ?? "";
    btn.textContent = "⏳ Generating with Gemini Pro…";
    try {
      const d = await apiPost<{ suggestion: string }>(`/tickets/${iid}/suggest`);
      const card = btn.closest(".ticket-card");
      const codeEl = card?.querySelector(".ticket-suggestion code");
      if (codeEl) codeEl.textContent = d.suggestion;
      btn.textContent = "✓ Updated · regenerate again";
      btn.disabled = false;
    } catch (e) {
      btn.textContent = `⚠ Failed · ${e instanceof Error ? e.message : String(e)}`;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 3000);
    }
  }

  return (
    <>
      <Topbar pageKey="tickets" />

      <main>
        <section className="kpi-row">
          <Kpi
            label={t("tickets.kpi.open")}
            value={summary?.open_count ?? "—"}
            suffix={t("tickets.kpi.open.sub")}
            icon={<AlertOctagon className="icon-svg" />}
            variant="critical"
          />
          <Kpi
            label={t("tickets.kpi.exposure")}
            value={summary?.total_open_exposure_label ?? "—"}
            suffix={t("tickets.kpi.exposure.sub")}
            icon={<Wallet className="icon-svg" />}
            variant="warning"
          />
          <Kpi
            label={t("tickets.kpi.resolved")}
            value={summary?.by_status.resolved ?? 0}
            suffix={t("tickets.kpi.resolved.sub")}
            icon={<CheckCircle className="icon-svg" />}
            variant="primary"
          />
          <Kpi
            label={t("tickets.kpi.total")}
            value={summary?.total_tickets ?? "—"}
            suffix={t("tickets.kpi.total.sub")}
            icon={<Archive className="icon-svg" />}
            variant="volume"
          />
        </section>

        <Card>
          <div className="card-head feed-head">
            <div>
              <h2>{t("tickets.list")}</h2>
              <p className="muted">{t("tickets.list.desc")}</p>
            </div>
            <div className="feed-filters">
              {([
                ["", "tickets.filter.all"],
                ["open", "tickets.filter.open"],
                ["in_progress", "tickets.filter.in_progress"],
                ["resolved", "tickets.filter.resolved"],
                ["dismissed", "tickets.filter.dismissed"],
              ] as Array<[StatusFilter, string]>).map(([k, key]) => (
                <button
                  key={k}
                  type="button"
                  className={`filter-btn ${filter === k ? "active" : ""}`}
                  onClick={() => setFilter(k)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          <div className="ticket-section">
            {tickets.length === 0 && (
              <div className="muted" style={{ padding: 24, textAlign: "center" }}>
                No tickets in this filter.
              </div>
            )}
            {tickets.map((tk) => (
              <div className={`ticket-card ${tk.severity}`} key={tk.ticket_id}>
                <div className="ticket-head">
                  <div style={{ flex: 1 }}>
                    <div className="ticket-id">
                      {tk.ticket_id} · <span className="muted">{tk.actor}</span> · {tk.channel} ·{" "}
                      {new Date(tk.created_at).toLocaleString()}
                    </div>
                    <div className="ticket-title">{tk.title}</div>
                    <div style={{ marginTop: 4 }}>
                      <span className={`reg-chip ${tk.regulation}`}>
                        {REG_LABELS[tk.regulation] ?? tk.regulation}
                      </span>
                      <span className={`sev-pill ${tk.severity}`}>{tk.severity}</span>
                      {tk.regulation_long && (
                        <span className="muted small" style={{ marginLeft: 6 }}>
                          {tk.regulation_long}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`ticket-status ${tk.status}`}>{tk.status.replace("_", " ")}</span>
                </div>

                <div className="ticket-cost">
                  <AlertTriangle className="icon-svg" />
                  <div>
                    <div className="cost-label">Estimated cost if not remediated</div>
                    <div className="cost-value">
                      {tk.estimated_exposure_label}
                      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)" }}>
                        {" "}· max fine: {tk.max_fine_label}
                      </span>
                    </div>
                  </div>
                </div>

                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                    View transcript & findings
                  </summary>
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 12px",
                      background: "var(--bg-elev)",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--blue-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                      User
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{tk.user_request}</div>
                    <div style={{ fontSize: 11, color: "var(--slate)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: 8, marginBottom: 4 }}>
                      Bot
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{tk.ai_response}</div>
                  </div>
                  <ul style={{ marginTop: 10, listStyle: "none", fontSize: 12, lineHeight: 1.6 }}>
                    {tk.findings.map((f, i) => (
                      <li key={i}>
                        <span className={`reg-chip ${f.regulation}`}>
                          {REG_LABELS[f.regulation] ?? f.regulation}
                        </span>{" "}
                        {(f.rationale ?? "").slice(0, 200)}
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="ticket-suggestion">
                  <div className="ticket-suggestion-label">💡 Suggested remediation</div>
                  <div style={{ marginTop: 4, color: "var(--ink-2)" }}>
                    Apply the change below to the system prompt of the affected agent.
                  </div>
                  <code>{tk.remediation_suggestion}</code>
                  <button
                    type="button"
                    className="ticket-actions"
                    style={{ marginTop: 8 }}
                    onClick={(e) => regen(tk.interaction_id, e.currentTarget)}
                  >
                    ↻ Regenerate with Gemini (tailored to this case)
                  </button>
                </div>

                <div className="ticket-actions">
                  {tk.status !== "in_progress" && (
                    <button type="button" onClick={() => setStatus(tk.interaction_id, "in_progress")}>
                      Mark in progress
                    </button>
                  )}
                  {tk.status !== "resolved" && (
                    <button type="button" className="primary" onClick={() => setStatus(tk.interaction_id, "resolved")}>
                      Mark resolved
                    </button>
                  )}
                  {tk.status !== "dismissed" && (
                    <button type="button" onClick={() => setStatus(tk.interaction_id, "dismissed")}>
                      Dismiss
                    </button>
                  )}
                  {tk.status !== "open" && (
                    <button type="button" onClick={() => setStatus(tk.interaction_id, "open")}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
