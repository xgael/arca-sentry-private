"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle, OctagonAlert, Search, TriangleAlert, Wallet, X } from "lucide-react";
import { api } from "../lib/api";
import { usePolling } from "../lib/swr";
import { REG_LABELS } from "../lib/constants";
import CountUp from "../components/CountUp";

type Status = "" | "open" | "in_progress" | "resolved" | "dismissed";
type SortKey = "newest" | "exposure" | "severity";

type Ticket = {
  ticket_id: string;
  interaction_id: string;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  severity: "critical" | "warning" | "advisory";
  regulation: string;
  regulation_long?: string;
  title: string;
  actor?: string;
  channel: string;
  created_at: string;
  estimated_exposure_label: string;
  estimated_exposure_value?: number;
  max_fine_label: string;
  user_request?: string;
  ai_response?: string;
  remediation_suggestion?: string;
  findings?: Array<{ regulation: string; rationale?: string }>;
};

type Summary = {
  open_count: number;
  total_open_exposure_label: string;
  total_tickets: number;
  by_status: Record<string, number>;
};

const FILTERS: Array<{ s: Status; label: string }> = [
  { s: "", label: "All" },
  { s: "open", label: "Open" },
  { s: "in_progress", label: "In progress" },
  { s: "resolved", label: "Resolved" },
  { s: "dismissed", label: "Dismissed" },
];

const SEVERITY_RANK: Record<Ticket["severity"], number> = {
  critical: 3,
  warning: 2,
  advisory: 1,
};

export default function TicketsPage() {
  const [status, setStatus] = useState<Status>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: summary } = usePolling<Summary>("/api/tickets/summary", 5000);
  const { data: ticketsData, mutate: mutateTickets } = usePolling<{ tickets: Ticket[] }>(
    status ? `/api/tickets?status=${status}&limit=100` : "/api/tickets?limit=100",
    6000,
  );

  const tickets = ticketsData?.tickets ?? [];

  // Clear selection when filter changes
  useEffect(() => { setSelected(new Set()); }, [status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = tickets;
    if (q) {
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.actor || "").toLowerCase().includes(q) ||
          t.regulation.toLowerCase().includes(q) ||
          (REG_LABELS[t.regulation] || "").toLowerCase().includes(q),
      );
    }
    const sorted = [...arr];
    if (sort === "severity") {
      sorted.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
    } else if (sort === "exposure") {
      sorted.sort((a, b) => (b.estimated_exposure_value ?? 0) - (a.estimated_exposure_value ?? 0));
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return sorted;
  }, [tickets, search, sort]);

  const toggleSelect = useCallback((iid: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(iid)) next.delete(iid);
      else next.add(iid);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((cur) =>
      cur.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.interaction_id)),
    );
  }, [filtered]);

  const setTicketStatus = useCallback(
    async (iids: string[], s: Ticket["status"]) => {
      await Promise.all(
        iids.map((iid) => fetch(`/api/tickets/${iid}/status?status=${s}`, { method: "PATCH" })),
      );
      setSelected(new Set());
      mutateTickets();
    },
    [mutateTickets],
  );

  return (
    <>
      <section className="kpi-row">
        <div className="kpi kpi-critical">
          <div className="kpi-label">
            <OctagonAlert className="kpi-icon" size={16} />
            <span>Open tickets</span>
          </div>
          <div className="kpi-value">
            {summary ? <CountUp value={summary.open_count} /> : "—"}
          </div>
          <div className="kpi-suffix">awaiting remediation</div>
        </div>
        <div className="kpi kpi-warning">
          <div className="kpi-label">
            <Wallet className="kpi-icon" size={16} />
            <span>Estimated exposure</span>
          </div>
          <div className="kpi-value">{summary?.total_open_exposure_label ?? "—"}</div>
          <div className="kpi-suffix">potential fines if not remediated</div>
        </div>
        <div className="kpi kpi-primary">
          <div className="kpi-label">
            <CheckCircle className="kpi-icon" size={16} />
            <span>Resolved</span>
          </div>
          <div className="kpi-value">
            {summary ? <CountUp value={summary.by_status.resolved || 0} /> : "—"}
          </div>
          <div className="kpi-suffix">closed out</div>
        </div>
        <div className="kpi kpi-volume">
          <div className="kpi-label">
            <Archive className="kpi-icon" size={16} />
            <span>Total tickets</span>
          </div>
          <div className="kpi-value">
            {summary ? <CountUp value={summary.total_tickets} /> : "—"}
          </div>
          <div className="kpi-suffix">all time</div>
        </div>
      </section>

      <section className="card">
        <div className="card-head feed-head">
          <div>
            <h2>Remediation queue</h2>
            <p className="muted">
              Every warning or critical detected by SENTRY becomes a ticket here, with an estimated cost
              if left unresolved and a suggested fix.
            </p>
          </div>
          <div className="feed-filters">
            {FILTERS.map((f) => (
              <button
                key={f.s}
                className={`filter-btn ${status === f.s ? "active" : ""}`}
                onClick={() => setStatus(f.s)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ticket-toolbar">
          <div className="ticket-search">
            <Search size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, actor, regulation…"
              autoComplete="off"
            />
            {search && (
              <button className="ticket-search-clear" onClick={() => setSearch("")} aria-label="Clear">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="ticket-sort">
            <label>Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="newest">Newest first</option>
              <option value="severity">Severity (critical first)</option>
              <option value="exposure">Exposure (€ desc)</option>
            </select>
          </div>
          <div className="ticket-summary">
            Showing <strong>{filtered.length}</strong> of {tickets.length}
          </div>
        </div>

        <div className="ticket-section">
          {filtered.length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: "center" }}>
              {search ? `No tickets match "${search}".` : "No tickets in this filter."}
            </div>
          ) : (
            <>
              <label className="ticket-select-all">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                />
                <span>Select all visible ({filtered.length})</span>
              </label>
              {filtered.map((t) => (
                <TicketCard
                  key={t.ticket_id}
                  t={t}
                  selected={selected.has(t.interaction_id)}
                  onToggleSelect={() => toggleSelect(t.interaction_id)}
                  onSetStatus={(s) => setTicketStatus([t.interaction_id], s)}
                />
              ))}
            </>
          )}
        </div>
      </section>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <div className="bulk-info">
            <strong>{selected.size}</strong> ticket{selected.size === 1 ? "" : "s"} selected
          </div>
          <div className="bulk-actions">
            <button onClick={() => setTicketStatus(Array.from(selected), "in_progress")}>
              Mark in progress
            </button>
            <button
              className="primary"
              onClick={() => setTicketStatus(Array.from(selected), "resolved")}
            >
              Resolve {selected.size}
            </button>
            <button onClick={() => setTicketStatus(Array.from(selected), "dismissed")}>
              Dismiss
            </button>
            <button className="ghost" onClick={() => setSelected(new Set())}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TicketCard({
  t,
  selected,
  onToggleSelect,
  onSetStatus,
}: {
  t: Ticket;
  selected: boolean;
  onToggleSelect: () => void;
  onSetStatus: (s: Ticket["status"]) => void;
}) {
  const [suggestion, setSuggestion] = useState(t.remediation_suggestion || "");
  const [regenLabel, setRegenLabel] = useState("↻ Regenerate with Gemini (tailored to this case)");
  const [regenerating, setRegenerating] = useState(false);

  const regen = async () => {
    setRegenerating(true);
    setRegenLabel("⏳ Generating with Gemini Pro…");
    try {
      const r = await fetch(`/api/tickets/${t.interaction_id}/suggest`, { method: "POST" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = (await r.json()) as { suggestion: string };
      setSuggestion(d.suggestion);
      setRegenLabel("✓ Updated · regenerate again");
    } catch (e) {
      setRegenLabel("⚠ Failed · " + (e instanceof Error ? e.message : ""));
      setTimeout(() => setRegenLabel("↻ Regenerate with Gemini"), 3000);
    } finally {
      setRegenerating(false);
    }
  };

  const reg = REG_LABELS[t.regulation] || t.regulation;
  const created = new Date(t.created_at).toLocaleString();

  return (
    <div className={`ticket-card ${t.severity} ${selected ? "selected" : ""}`}>
      <div className="ticket-head">
        <label className="ticket-checkbox" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        </label>
        <div style={{ flex: 1 }}>
          <div className="ticket-id">
            {t.ticket_id} · <span className="muted">{t.actor || ""}</span> · {t.channel} · {created}
          </div>
          <div className="ticket-title">{t.title}</div>
          <div style={{ marginTop: 4 }}>
            <span className={`reg-chip ${t.regulation}`}>{reg}</span>
            <span className={`sev-pill ${t.severity}`}>{t.severity}</span>
            <span className="muted small" style={{ marginLeft: 6 }}>
              {t.regulation_long || ""}
            </span>
          </div>
        </div>
        <span className={`ticket-status ${t.status}`}>{t.status.replace("_", " ")}</span>
      </div>

      <div className="ticket-cost">
        <TriangleAlert size={18} />
        <div>
          <div className="cost-label">Estimated cost if not remediated</div>
          <div className="cost-value">
            {t.estimated_exposure_label}
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)" }}>
              {" "}· max fine: {t.max_fine_label}
            </span>
          </div>
        </div>
      </div>

      <details style={{ marginTop: 8 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 12,
            color: "var(--ink-3)",
            fontWeight: 600,
          }}
        >
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
          <div
            style={{
              fontSize: 11,
              color: "var(--blue-700)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            User
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{t.user_request || ""}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--slate)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Bot
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{t.ai_response || ""}</div>
        </div>
        <ul style={{ marginTop: 10, listStyle: "none", fontSize: 12, lineHeight: 1.6 }}>
          {(t.findings || []).map((f, i) => (
            <li key={i}>
              <span className={`reg-chip ${f.regulation}`}>
                {REG_LABELS[f.regulation] || f.regulation}
              </span>{" "}
              {(f.rationale || "").slice(0, 200)}
            </li>
          ))}
        </ul>
      </details>

      <div className="ticket-suggestion">
        <div className="ticket-suggestion-label">💡 Suggested remediation</div>
        <div style={{ marginTop: 4, color: "var(--ink-2)" }}>
          Apply the change below to the system prompt of the affected agent.
        </div>
        <code>{suggestion}</code>
        <button
          className="ticket-actions"
          style={{ marginTop: 8 }}
          onClick={regen}
          disabled={regenerating}
        >
          <span>{regenLabel}</span>
        </button>
      </div>

      <div className="ticket-actions">
        {t.status !== "in_progress" && (
          <button onClick={() => onSetStatus("in_progress")}>Mark in progress</button>
        )}
        {t.status !== "resolved" && (
          <button className="primary" onClick={() => onSetStatus("resolved")}>
            Mark resolved
          </button>
        )}
        {t.status !== "dismissed" && (
          <button onClick={() => onSetStatus("dismissed")}>Dismiss</button>
        )}
        {t.status !== "open" && <button onClick={() => onSetStatus("open")}>Reopen</button>}
      </div>
    </div>
  );
}
