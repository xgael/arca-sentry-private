"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  Mic,
  MessageSquare,
  PlugZap,
} from "lucide-react";
import {
  api,
  type ByRegulation,
  type FeedItem,
  type Recent,
  type Summary,
  type Timeline,
  type Decision,
} from "./lib/api";
import { usePolling, useOnce } from "./lib/swr";
import { LANG_TAG, REG_COLORS, REG_LABELS } from "./lib/constants";
import AutoDemo from "./components/AutoDemo";

const RANGES = [
  { id: "1h", label: "1h", hours: 1, buckets: 12 },
  { id: "24h", label: "24h", hours: 24, buckets: 24 },
  { id: "7d", label: "7d", hours: 168, buckets: 28 },
  { id: "30d", label: "30d", hours: 720, buckets: 30 },
] as const;
type RangeId = (typeof RANGES)[number]["id"];
import CountUp from "./components/CountUp";
import AgentGrid, { type AgentState } from "./components/AgentGrid";
import {
  DonutChart,
  RegBarChart,
  SparkLine,
  TimelineChart,
} from "./components/charts";
import { useToast } from "./components/ToastContainer";
import { useDrawer } from "./components/Drawer";

const FILTERS = ["all", "critical", "warning", "advisory"] as const;
type Filter = (typeof FILTERS)[number];

const CHANNEL_ICON_COMP: Record<string, React.ComponentType<{ size?: number }>> = {
  text: MessageSquare,
  voice: Mic,
  api: PlugZap,
};

export default function Home() {
  const toast = useToast();
  const openDrawer = useDrawer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rangeId = (searchParams.get("range") as RangeId) || "24h";
  const range = RANGES.find((r) => r.id === rangeId) || RANGES[1];

  const [filter, setFilter] = useState<Filter>("all");
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const knownSeqs = useRef<Set<number>>(new Set());
  const firstLoad = useRef(false);

  const setRange = useCallback(
    (id: RangeId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "24h") params.delete("range");
      else params.set("range", id);
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const { data: scenariosData } = useOnce<{ scenarios: string[] }>("/api/demo/scenarios");
  const scenarios = scenariosData?.scenarios ?? [];

  const { data: summary, mutate: mutateSummary } = usePolling<Summary>("/api/stats/summary");
  const { data: timeline, mutate: mutateTimeline } = usePolling<Timeline>(
    `/api/stats/timeline?hours=${range.hours}&buckets=${range.buckets}`,
  );
  const { data: regs, mutate: mutateRegs } = usePolling<ByRegulation>("/api/stats/by_regulation");
  const { data: recent, mutate: mutateRecent } = usePolling<Recent>("/api/stats/recent?limit=40");

  const refreshAll = useCallback(() => {
    mutateSummary();
    mutateTimeline();
    mutateRegs();
    mutateRecent();
  }, [mutateSummary, mutateTimeline, mutateRegs, mutateRecent]);

  const feed = recent?.items ?? [];

  // Toast detection for new criticals
  useEffect(() => {
    const items = recent?.items;
    if (!items) return;
    if (!firstLoad.current) {
      items.forEach((i) => knownSeqs.current.add(i.seq));
      firstLoad.current = true;
      return;
    }
    items.forEach((i) => {
      if (knownSeqs.current.has(i.seq)) return;
      knownSeqs.current.add(i.seq);
      if (i.severity === "critical" || i.severity === "warning") {
        const first = i.findings?.[0];
        const reg = first ? REG_LABELS[first.regulation] || first.regulation : "Unknown";
        toast({
          title: `${i.severity.toUpperCase()} · ${reg}`,
          msg: i.response_preview || "New violation detected.",
          type: i.severity === "critical" ? "critical" : "warning",
        });
      }
    });
  }, [recent, toast]);

  // Scenario run
  const runScenario = useCallback(
    async (name: string) => {
      setRunningScenario(name);
      setAgents({
        eu_ai_act_auditor: "active",
        gdpr_auditor: "active",
        dora_auditor: "active",
        pii_leak_detector: "active",
        prompt_injection_detector: "active",
      });
      const d = await api<Decision>("/api/demo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: name }),
        cache: "no-store",
      });
      if (d) {
        const flagged = new Set((d.findings || []).map((f) => f.agent));
        const next: Record<string, AgentState> = {};
        for (const k of [
          "eu_ai_act_auditor",
          "gdpr_auditor",
          "dora_auditor",
          "pii_leak_detector",
          "prompt_injection_detector",
        ]) {
          next[k] = flagged.has(k) ? "flagged" : "clean";
        }
        setAgents(next);
        setTimeout(refreshAll, 200);
        setTimeout(() => openDrawer(d.interaction_id), 700);
        setTimeout(() => setAgents({}), 6000);
      }
      setRunningScenario(null);
    },
    [refreshAll, openDrawer],
  );

  const sparkData = useMemo(() => {
    if (!timeline) return [];
    return timeline.interactions.map((n, i) => {
      if (n === 0) return 100;
      const flagged = (timeline.warnings[i] || 0) + (timeline.criticals[i] || 0);
      return Math.round((1 - flagged / n) * 100);
    });
  }, [timeline]);

  const filtered = feed.filter((i) => filter === "all" || i.severity === filter);

  return (
    <>
      <AutoDemo scenarios={scenarios} onRunScenario={runScenario} />

      <section className="dash-toolbar">
        <div className="range-pills">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`range-pill ${rangeId === r.id ? "active" : ""}`}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="range-label">
          {summary && (
            <>
              <span className="range-live"><span className="live-dot" /> live</span>
              <span>·</span>
              <span>{summary.total_interactions} total · {summary.violations.total_flagged} flagged</span>
            </>
          )}
        </div>
      </section>

      <section className="kpi-row">
        <div className="kpi kpi-primary">
          <div className="kpi-label">
            <ShieldCheck className="kpi-icon" size={16} />
            <span>Compliance rate</span>
          </div>
          <div className={`kpi-value ${summary ? "" : "skeleton"}`}>
            {summary ? (
              <CountUp value={summary.compliance_rate} decimals={1} suffix="%" />
            ) : (
              "—"
            )}
          </div>
          <div className="kpi-suffix"><span>last 24h</span></div>
          {sparkData.length > 0 && (
            <div style={{ position: "absolute", inset: 0, top: "auto", height: 40, pointerEvents: "none" }}>
              <SparkLine data={sparkData} />
            </div>
          )}
        </div>
        <div className="kpi kpi-critical">
          <div className="kpi-label">
            <ShieldAlert className="kpi-icon" size={16} />
            <span>Critical violations</span>
          </div>
          <div className={`kpi-value ${summary ? "" : "skeleton"}`}>
            {summary ? <CountUp value={summary.violations.critical} /> : "—"}
          </div>
          <div className="kpi-suffix"><span>blocked at gateway</span></div>
        </div>
        <div className="kpi kpi-warning">
          <div className="kpi-label">
            <TriangleAlert className="kpi-icon" size={16} />
            <span>Warnings</span>
          </div>
          <div className={`kpi-value ${summary ? "" : "skeleton"}`}>
            {summary ? <CountUp value={summary.violations.warning} /> : "—"}
          </div>
          <div className="kpi-suffix"><span>compliance team notified</span></div>
        </div>
        <div className="kpi kpi-volume">
          <div className="kpi-label">
            <Activity className="kpi-icon" size={16} />
            <span>Interactions audited</span>
          </div>
          <div className={`kpi-value ${summary ? "" : "skeleton"}`}>
            {summary ? <CountUp value={summary.total_interactions} /> : "—"}
          </div>
          <div className="kpi-suffix">
            <span className="live-dot" />
            <span>{summary?.interactions_per_minute ?? 0}</span>/min · live
          </div>
        </div>
      </section>

      <section className="card demo-bar">
        <div className="card-head">
          <h2>Try it live</h2>
          <p className="muted">
            Click a scenario to run a synthetic AI interaction through the full pipeline.
            Six pre-loaded violations across EU AI Act, GDPR, DORA, PII and prompt injection
            — in English, Spanish and Italian.
          </p>
        </div>
        <div className="scenarios">
          {scenarios.map((s) => (
            <button
              key={s}
              className="scenario-btn"
              disabled={runningScenario === s}
              onClick={() => runScenario(s)}
            >
              {s.replace(/_/g, " ")}
              <span className="lang-badge">{LANG_TAG[s] || "EN"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <h2>Compliance overview</h2>
          <p className="muted">24h breakdown</p>
          <div className="chart-wrap">
            <DonutChart
              compliant={
                summary
                  ? Math.max(0, summary.total_interactions - summary.violations.total_flagged)
                  : 1
              }
              warning={summary?.violations.warning ?? 0}
              critical={summary?.violations.critical ?? 0}
            />
          </div>
        </div>
        <div className="card chart-card chart-wide">
          <h2>Violations timeline</h2>
          <p className="muted">Interactions vs warnings vs criticals, hourly buckets</p>
          <div className="chart-wrap">
            <TimelineChart
              labels={timeline?.labels ?? []}
              interactions={timeline?.interactions ?? []}
              warnings={timeline?.warnings ?? []}
              criticals={timeline?.criticals ?? []}
            />
          </div>
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card chart-wide">
          <h2>Top regulations flagged</h2>
          <p className="muted">Findings by regulation, last 24h</p>
          <div className="chart-wrap">
            <RegBarChart
              items={(regs?.items ?? []).map((i) => ({
                label: REG_LABELS[i.regulation] || i.regulation,
                count: i.count,
                color: REG_COLORS[i.regulation] || "#888",
              }))}
            />
          </div>
        </div>
        <div className="card chart-card">
          <h2>Auditor council</h2>
          <p className="muted">5 specialized agents, current load</p>
          <AgentGrid states={agents} />
        </div>
      </section>

      <section className="card live-feed">
        <div className="card-head feed-head">
          <div>
            <h2>Live event stream</h2>
            <p className="muted">Click any row for full forensic detail · auto-refreshes every 3 s</p>
          </div>
          <div className="feed-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="feed-table-wrap">
          <table className="feed-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Channel</th>
                <th>Actor</th>
                <th>Snippet</th>
                <th>Findings</th>
                <th>Action</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-title">
                        No events {filter !== "all" ? `at ${filter} level` : "yet"}
                      </div>
                      <div className="empty-state-desc">
                        {filter === "all"
                          ? "Click any demo scenario above to send a synthetic interaction through the audit pipeline."
                          : 'Switch the filter to "All" or trigger a violation from the Playground.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const Icon = CHANNEL_ICON_COMP[i.channel] || PlugZap;
                  return (
                    <tr key={i.seq} onClick={() => openDrawer(i.interaction_id)}>
                      <td className="time-cell">
                        {new Date(i.created_at).toLocaleTimeString("en-GB")}
                      </td>
                      <td>
                        <span className={`sev-pill ${i.severity}`}>{i.severity}</span>
                      </td>
                      <td>
                        <span className="channel-icon">
                          <Icon size={14} />
                        </span>
                        {i.channel}
                      </td>
                      <td className="actor-cell">{i.actor || ""}</td>
                      <td className="snippet-cell">{i.response_preview || ""}</td>
                      <td>
                        {(i.findings || []).length > 0 ? (
                          (i.findings || []).map((f, j) => (
                            <span key={j} className={`reg-chip ${f.regulation}`}>
                              {REG_LABELS[f.regulation] || f.regulation}
                            </span>
                          ))
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className={`action-cell ${i.action_taken}`}>{i.action_taken}</td>
                      <td className="arrow-cell">→</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
