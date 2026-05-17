"use client";

import { useEffect, useState } from "react";
import { apiGet, apiUrl, type AuditReport } from "@/lib/api";
import { REG_LABELS } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface DrawerProps {
  interactionId: string | null;
  onClose: () => void;
}

export default function Drawer({ interactionId, onClose }: DrawerProps) {
  const { t } = useT();
  const [data, setData] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    if (!interactionId) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await apiGet<AuditReport>(`/reports/${interactionId}.json`);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [interactionId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = interactionId !== null;

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-head">
          <div>
            <div className="drawer-title">{t("drawer.title")}</div>
            <div className="drawer-subtitle">{interactionId ?? ""}</div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {!data && !error && interactionId && (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>
              Loading audit detail…
            </div>
          )}
          {error && <div className="muted">Error: {error}</div>}
          {data && <DrawerContent data={data} t={t} />}
        </div>
      </aside>
    </>
  );
}

function DrawerContent({ data, t }: { data: AuditReport; t: (k: string) => string }) {
  const verdictKey = `verdict.${data.severity}`;
  return (
    <>
      <div className={`drawer-verdict ${data.severity}`}>
        <div className="label">{t(verdictKey)}</div>
        <div className="summary">{data.summary || "No summary."}</div>
      </div>

      {(data.request || data.response) && (
        <div className="drawer-section">
          <h3>{t("drawer.section.transcript")}</h3>
          <div className="turn user">
            <div className="turn-role">
              {t("drawer.role.user")} · {data.channel || "text"}
            </div>
            <div>{data.request || "(no message)"}</div>
          </div>
          <div className="turn ai">
            <div className="turn-role">{data.actor || "AI"}</div>
            <div>{data.response || "(no message)"}</div>
          </div>
        </div>
      )}

      {data.findings.length > 0 && (
        <div className="drawer-section">
          <h3>
            {t("drawer.section.findings")} ({data.findings.length})
          </h3>
          {data.findings.map((f, idx) => (
            <div className="finding-card" key={idx}>
              <div className="finding-head">
                <span className="finding-agent">{f.agent}</span>
                <span className="finding-conf">conf {(f.confidence * 100).toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: 11, marginBottom: 6 }}>
                <span className={`reg-chip ${f.regulation}`}>
                  {REG_LABELS[f.regulation] ?? f.regulation}
                </span>
                {f.article && <span className="muted">{f.article}</span>}
              </div>
              <div className="finding-rationale">{f.rationale}</div>
            </div>
          ))}
        </div>
      )}

      {data.long_report && data.long_report.length > 30 && (
        <div className="drawer-section">
          <h3>{t("drawer.section.report")}</h3>
          <div className="report-content">{data.long_report}</div>
        </div>
      )}

      {data.event_hash && (
        <div className="drawer-section">
          <h3>{t("drawer.section.hash")}</h3>
          <div className="event-hash">{data.event_hash}</div>
        </div>
      )}

      <div className="drawer-links">
        <a href={apiUrl(`/reports/${data.interaction_id}.pdf`)} target="_blank" rel="noopener">
          {t("drawer.download_pdf")}
        </a>
        <a href={apiUrl(`/reports/${data.interaction_id}.json`)} target="_blank" rel="noopener">
          {t("drawer.raw_json")}
        </a>
        <a href={apiUrl(`/reports/${data.interaction_id}`)} target="_blank" rel="noopener">
          {t("drawer.html_view")}
        </a>
      </div>
    </>
  );
}
