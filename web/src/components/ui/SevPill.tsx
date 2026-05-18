import type { Severity } from "@/lib/api";

const LABELS: Record<Severity, string> = {
  advisory: "advisory",
  warning: "warning",
  critical: "critical",
};

export default function SevPill({ severity }: { severity: Severity }) {
  return <span className={`sev-pill ${severity}`}>{LABELS[severity]}</span>;
}
