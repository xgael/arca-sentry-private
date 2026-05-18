import { REG_LABELS } from "@/lib/format";
import type { Regulation } from "@/lib/api";

export default function RegChip({ regulation }: { regulation: Regulation }) {
  return (
    <span className={`reg-chip ${regulation}`}>
      {REG_LABELS[regulation] ?? regulation}
    </span>
  );
}
