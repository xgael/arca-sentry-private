"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Report } from "../lib/api";
import { REG_LABELS } from "../lib/constants";

type Ctx = (interactionId: string) => void;
const DrawerCtx = createContext<Ctx>(() => {});
export const useDrawer = () => useContext(DrawerCtx);

export default function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [iid, setIid] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback((id: string) => {
    setIid(id);
    setLoading(true);
    setReport(null);
    api<Report>(`/api/reports/${id}.json`).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, []);

  const close = useCallback(() => {
    setIid(null);
    setReport(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const isOpen = iid !== null;

  return (
    <DrawerCtx.Provider value={open}>
      {children}
      <div className={`drawer-backdrop ${isOpen ? "open" : ""}`} onClick={close} />
      <aside className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <div>
            <div className="drawer-title">Audit detail</div>
            <div className="drawer-subtitle">{iid ?? "—"}</div>
          </div>
          <button className="drawer-close" onClick={close}>
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {loading && (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>
              Loading audit detail…
            </div>
          )}
          {!loading && report && iid && <ReportView r={report} iid={iid} />}
          {!loading && !report && iid && (
            <div className="muted">Could not load report.</div>
          )}
        </div>
      </aside>
    </DrawerCtx.Provider>
  );
}

function ReportView({ r, iid }: { r: Report; iid: string }) {
  const verdict =
    r.severity === "critical"
      ? "Critical · response BLOCKED at gateway"
      : r.severity === "warning"
        ? "Warning · compliance team notified"
        : "Advisory · logged only";

  const hasTranscript = Boolean((r.request || "").trim() || (r.response || "").trim());

  return (
    <>
      <div className={`drawer-verdict ${r.severity}`}>
        <div className="label">{verdict}</div>
        <div className="summary">{r.summary || "No summary."}</div>
      </div>

      {hasTranscript && (
        <div className="drawer-section">
          <h3>Conversation transcript</h3>
          <div className="turn user">
            <div className="turn-role">User · {r.channel || "text"}</div>
            <div>{r.request || "(no message)"}</div>
          </div>
          <div className="turn ai">
            <div className="turn-role">{r.actor || "AI"}</div>
            <div>{r.response || "(no message)"}</div>
          </div>
        </div>
      )}

      {(r.findings || []).length > 0 && (
        <div className="drawer-section">
          <h3>Auditor findings ({r.findings.length})</h3>
          {r.findings.map((f, i) => (
            <div key={i} className="finding-card">
              <div className="finding-head">
                <span className="finding-agent">{f.agent}</span>
                <span className="finding-conf">
                  conf {(f.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: 11, marginBottom: 6 }}>
                <span className={`reg-chip ${f.regulation}`}>
                  {REG_LABELS[f.regulation] || f.regulation}
                </span>
                {f.article && <span className="muted"> {f.article}</span>}
              </div>
              <div className="finding-rationale">{f.rationale || ""}</div>
            </div>
          ))}
        </div>
      )}

      {r.long_report && r.long_report.length > 30 && (
        <div className="drawer-section">
          <h3>Compliance report — Gemini Pro</h3>
          <div className="report-content">{r.long_report}</div>
        </div>
      )}

      {r.event_hash && (
        <div className="drawer-section">
          <h3>Tamper-evident event hash · SHA-256</h3>
          <div className="event-hash">{r.event_hash}</div>
        </div>
      )}

      <div className="drawer-links">
        <a href={`/api/reports/${iid}.pdf`} target="_blank" rel="noopener">
          Download PDF
        </a>
        <a href={`/api/reports/${iid}.json`} target="_blank" rel="noopener">
          Raw JSON
        </a>
        <a href={`/api/reports/${iid}`} target="_blank" rel="noopener">
          HTML view
        </a>
      </div>
    </>
  );
}
