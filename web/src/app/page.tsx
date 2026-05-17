"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import SevPill from "@/components/ui/SevPill";
import RegChip from "@/components/ui/RegChip";
import Drawer from "@/components/ui/Drawer";
import DonutCompliance from "@/components/charts/DonutCompliance";
import TimelineChart from "@/components/charts/TimelineChart";
import RegsBar from "@/components/charts/RegsBar";
import Sparkline from "@/components/charts/Sparkline";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { apiGet, apiPost, type FeedItem, type SummaryStats, type TimelineData, type RegStats, type Severity } from "@/lib/api";
import { CHANNEL_ICONS, LANG_TAG, REG_LABELS, formatTime } from "@/lib/format";

type FilterKey = "all" | "critical" | "warning" | "advisory";
type AgentState = "idle" | "auditing…" | "flagged" | "clean";

interface AgentRow {
  name: string;
  label: string;
  state: AgentState;
}

const INITIAL_AGENTS: AgentRow[] = [
  { name: "eu_ai_act_auditor", label: "EU AI Act", state: "idle" },
  { name: "gdpr_auditor", label: "GDPR", state: "idle" },
  { name: "dora_auditor", label: "DORA", state: "idle" },
  { name: "pii_leak_detector", label: "PII Leak", state: "idle" },
  { name: "prompt_injection_detector", label: "Prompt Injection", state: "idle" },
];

export default function DashboardPage() {
  const { t } = useT();

  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [regs, setRegs] = useState<RegStats | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>(INITIAL_AGENTS);
  const [busy, setBusy] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const knownSeqs = useRef<Set<number>>(new Set());
  const firstLoad = useRef(false);

  const refreshAll = useCallback(async () => {
    const [s, tl, rg, fd] = await Promise.allSettled([
      apiGet<SummaryStats>("/stats/summary"),
      apiGet<TimelineData>("/stats/timeline?hours=24&buckets=24"),
      apiGet<RegStats>("/stats/by_regulation"),
      apiGet<{ items: FeedItem[] }>("/stats/recent?limit=40"),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (tl.status === "fulfilled") setTimeline(tl.value);
    if (rg.status === "fulfilled") setRegs(rg.value);
    if (fd.status === "fulfilled") {
      const items = fd.value.items;
      if (firstLoad.current) {
        for (const i of items) {
          if (!knownSeqs.current.has(i.seq) && (i.severity === "critical" || i.severity === "warning")) {
            knownSeqs.current.add(i.seq);
            const first = i.findings[0];
            const reg = first ? (REG_LABELS[first.regulation] ?? first.regulation) : "Unknown";
            const title = `${i.severity.toUpperCase()} · ${reg}`;
            const description = i.response_preview || "New violation detected.";
            if (i.severity === "critical") {
              toast.error(title, { description });
            } else {
              toast.warning(title, { description });
            }
          } else {
            knownSeqs.current.add(i.seq);
          }
        }
      } else {
        for (const i of items) knownSeqs.current.add(i.seq);
      }
      setFeed(items);
      firstLoad.current = true;
    }
  }, []);

  useEffect(() => {
    apiGet<{ scenarios: string[] }>("/demo/scenarios").then((d) => setScenarios(d.scenarios)).catch(() => {});
    void refreshAll();
    const id = setInterval(refreshAll, 3000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Auto-seed: if the dashboard is empty when a visitor lands, auto-run one
  // demo scenario so they never see a blank canvas. Only fires once.
  const autoSeedFired = useRef(false);
  useEffect(() => {
    if (autoSeedFired.current) return;
    if (!summary || !scenarios.length) return;
    if (summary.total_interactions > 0) {
      autoSeedFired.current = true;
      return;
    }
    autoSeedFired.current = true;
    const preferred = ["credit_denial", "prompt_injection", scenarios[0]];
    const pick = preferred.find((s) => scenarios.includes(s)) ?? scenarios[0];
    setTimeout(() => { void runScenario(pick); }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, scenarios]);

  async function runScenario(name: string) {
    setBusy(name);
    setAgents((prev) => prev.map((a) => ({ ...a, state: "auditing…" })));
    try {
      const decision = await apiPost<{ interaction_id: string; findings?: Array<{ agent: string }> }>(
        "/demo/run",
        { scenario: name },
      );
      const flagged = new Set((decision.findings ?? []).map((f) => f.agent));
      setAgents((prev) => prev.map((a) => ({ ...a, state: flagged.has(a.name) ? "flagged" : "clean" })));
      setTimeout(refreshAll, 200);
      setTimeout(() => setDrawerId(decision.interaction_id), 700);
      setTimeout(() => setAgents(INITIAL_AGENTS), 6000);
    } catch (e) {
      console.error(e);
      setAgents(INITIAL_AGENTS);
    } finally {
      setBusy(null);
    }
  }

  const filtered = filter === "all" ? feed : feed.filter((f) => f.severity === filter);
  const compliantSlice = summary ? Math.max(0, summary.total_interactions - summary.violations.total_flagged) : 1;
  const sparkValues = timeline
    ? timeline.interactions.map((n, i) => {
        if (n === 0) return 100;
        const f = (timeline.warnings[i] ?? 0) + (timeline.criticals[i] ?? 0);
        return Math.round((1 - f / n) * 100);
      })
    : [];

  return (
    <>
      <Topbar pageKey="dashboard" />

      <main>
        <section className="hero-strip">
          <div className="hero-mega">
            <div className="hero-mega-eyebrow">Compliance rate · last 24h</div>
            <div className="hero-mega-val">
              {summary ? summary.compliance_rate.toFixed(1) : "—"}
              <span className="unit">%</span>
            </div>
            <div className="hero-mega-lbl">
              Continuous compliance auditing for enterprise AI across EU AI Act,
              GDPR, DORA, PII and prompt injection.
            </div>
          </div>
          <div className="hero-satellites">
            <div className="hero-satellite">
              <div className="hero-satellite-val">
                {summary ? summary.total_interactions.toLocaleString() : "—"}
              </div>
              <div className="hero-satellite-lbl">interactions audited</div>
            </div>
            <div className="hero-satellite">
              <div className="hero-satellite-val critical">
                {summary ? summary.violations.critical : "—"}
              </div>
              <div className="hero-satellite-lbl">critical blocked at gateway</div>
            </div>
            <div className="hero-satellite">
              <div className="hero-satellite-val">5</div>
              <div className="hero-satellite-lbl">regulations covered</div>
            </div>
          </div>
        </section>

        <section className="kpi-row">
          <div className="kpi kpi-primary">
            <div className="kpi-label">
              <ShieldCheck className="kpi-icon icon-svg" />
              <span>{t("kpi.compliance")}</span>
            </div>
            <div className="kpi-value">
              {summary ? `${summary.compliance_rate.toFixed(1)}%` : <span className="skeleton">—</span>}
            </div>
            <div className="kpi-suffix"><span>{t("kpi.compliance.sub")}</span></div>
            {sparkValues.length > 0 && timeline && (
              <div className="kpi-spark">
                <Sparkline labels={timeline.labels} values={sparkValues} />
              </div>
            )}
          </div>
          <Kpi
            label={t("kpi.critical")}
            value={summary ? summary.violations.critical : <span className="skeleton">—</span>}
            suffix={<span>{t("kpi.critical.sub")}</span>}
            icon={<ShieldAlert className="icon-svg" />}
            variant="critical"
          />
          <Kpi
            label={t("kpi.warning")}
            value={summary ? summary.violations.warning : <span className="skeleton">—</span>}
            suffix={<span>{t("kpi.warning.sub")}</span>}
            icon={<AlertTriangle className="icon-svg" />}
            variant="warning"
          />
          <Kpi
            label={t("kpi.total")}
            value={summary ? summary.total_interactions : <span className="skeleton">—</span>}
            suffix={
              <>
                <span className="live-dot" />
                <span>{summary?.interactions_per_minute ?? 0}</span>
                <span>{t("kpi.total.sub")}</span>
              </>
            }
            icon={<Activity className="icon-svg" />}
            variant="volume"
          />
        </section>

        <Card title={t("demo.title")} subtitle={t("demo.desc")} className="demo-bar">
          <div className="scenarios">
            {scenarios.map((name) => (
              <button
                key={name}
                type="button"
                className="scenario-btn"
                disabled={busy === name}
                onClick={() => runScenario(name)}
              >
                {name.replace(/_/g, " ")}
                <span className="lang-badge">{LANG_TAG[name] ?? "EN"}</span>
              </button>
            ))}
          </div>
        </Card>

        <section className="charts-row">
          <Card title={t("chart.donut.title")} subtitle={t("chart.donut.sub")} className="chart-card">
            <div className="chart-wrap">
              <DonutCompliance
                compliant={compliantSlice}
                warning={summary?.violations.warning ?? 0}
                critical={summary?.violations.critical ?? 0}
              />
            </div>
          </Card>
          <Card title={t("chart.timeline.title")} subtitle={t("chart.timeline.sub")} className="chart-card chart-wide">
            <div className="chart-wrap">
              {timeline ? (
                <TimelineChart
                  labels={timeline.labels}
                  interactions={timeline.interactions}
                  warnings={timeline.warnings}
                  criticals={timeline.criticals}
                />
              ) : null}
            </div>
          </Card>
        </section>

        <section className="charts-row">
          <Card title={t("chart.regs.title")} subtitle={t("chart.regs.sub")} className="chart-card chart-wide">
            <div className="chart-wrap">{regs && <RegsBar items={regs.items} />}</div>
          </Card>
          <Card title={t("chart.council.title")} subtitle={t("chart.council.sub")} className="chart-card">
            <div className="agent-grid">
              {agents.map((a) => (
                <div
                  key={a.name}
                  className={`agent ${a.state === "auditing…" ? "active" : ""} ${a.state === "flagged" ? "flagged" : ""}`}
                >
                  <div className="agent-name">{a.label}</div>
                  <div className="agent-state">{a.state}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="live-feed">
          <div className="card-head feed-head">
            <div>
              <h2>{t("feed.title")}</h2>
              <p className="muted">{t("feed.desc")}</p>
            </div>
            <div className="feed-filters">
              {(["all", "critical", "warning", "advisory"] as FilterKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`filter-btn ${filter === k ? "active" : ""}`}
                  onClick={() => setFilter(k)}
                >
                  {t(`feed.filter.${k}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="feed-table-wrap">
            <table className="feed-table">
              <thead>
                <tr>
                  <th>{t("feed.col.time")}</th>
                  <th>{t("feed.col.severity")}</th>
                  <th>{t("feed.col.channel")}</th>
                  <th>{t("feed.col.actor")}</th>
                  <th>{t("feed.col.snippet")}</th>
                  <th>{t("feed.col.findings")}</th>
                  <th>{t("feed.col.action")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={8}>
                      <EmptyState filter={filter} t={t} />
                    </td>
                  </tr>
                )}
                {filtered.map((i) => (
                  <FeedRow key={i.seq} item={i} onOpen={() => setDrawerId(i.interaction_id)} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Drawer interactionId={drawerId} onClose={() => setDrawerId(null)} />

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}

function FeedRow({ item, onOpen }: { item: FeedItem; onOpen: () => void }) {
  return (
    <tr onClick={onOpen}>
      <td className="time-cell">{formatTime(item.created_at)}</td>
      <td><SevPill severity={item.severity} /></td>
      <td>
        <span className="channel-icon">{CHANNEL_ICONS[item.channel] ?? "🔌"}</span>
        {item.channel}
      </td>
      <td className="actor-cell">{item.actor}</td>
      <td className="snippet-cell">{item.response_preview}</td>
      <td>
        {item.findings.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          item.findings.map((f, i) => <RegChip key={i} regulation={f.regulation} />)
        )}
      </td>
      <td className={`action-cell ${item.action_taken}`}>{item.action_taken}</td>
      <td className="arrow-cell">→</td>
    </tr>
  );
}

function EmptyState({ filter, t }: { filter: FilterKey; t: (k: string) => string }) {
  return (
    <div className="empty-state">
      <svg className="empty-state-svg" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="44" cy="44" r="36" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 6" opacity="0.4" />
        <path d="M30 44l10 10 18-22" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <circle cx="44" cy="44" r="44" fill="#2563eb" opacity="0.04" />
      </svg>
      <div className="empty-state-title">
        {filter === "all" ? t("feed.empty.initial") : `No events at ${filter} level`}
      </div>
      <div className="empty-state-desc">{t("feed.empty.filtered")}</div>
    </div>
  );
}

// Re-export Severity to silence unused-import lint where Severity type is referenced indirectly
export type { Severity };
