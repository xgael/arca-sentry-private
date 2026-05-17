"use client";

const AGENTS = [
  { name: "eu_ai_act_auditor", label: "EU AI Act" },
  { name: "gdpr_auditor", label: "GDPR" },
  { name: "dora_auditor", label: "DORA" },
  { name: "pii_leak_detector", label: "PII Leak" },
  { name: "prompt_injection_detector", label: "Prompt Injection" },
];

export type AgentState = "idle" | "active" | "flagged" | "clean";

export default function AgentGrid({
  states,
  className = "",
}: {
  states: Record<string, AgentState>;
  className?: string;
}) {
  return (
    <div className={`agent-grid ${className}`}>
      {AGENTS.map((a) => {
        const s = states[a.name] ?? "idle";
        return (
          <div
            key={a.name}
            data-name={a.name}
            className={`agent ${s === "active" ? "active" : ""} ${s === "flagged" ? "flagged" : ""}`}
          >
            <div className="agent-name">{a.label}</div>
            <div className="agent-state">{s}</div>
          </div>
        );
      })}
    </div>
  );
}
