import type { ReactNode } from "react";
import clsx from "clsx";

type KpiVariant = "primary" | "critical" | "warning" | "volume";

interface KpiProps {
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  icon?: ReactNode;
  variant?: KpiVariant;
  id?: string;
}

export default function Kpi({ label, value, suffix, icon, variant = "primary", id }: KpiProps) {
  return (
    <div className={clsx("kpi", `kpi-${variant}`)}>
      <div className="kpi-label">
        {icon && <span className="kpi-icon">{icon}</span>}
        {label}
      </div>
      <div className="kpi-value" id={id}>{value}</div>
      {suffix && <div className="kpi-suffix">{suffix}</div>}
    </div>
  );
}
