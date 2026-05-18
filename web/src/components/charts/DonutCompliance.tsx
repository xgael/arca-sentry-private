"use client";

import { Doughnut } from "react-chartjs-2";
import { ensureChartSetup, tooltipStyle } from "./ChartSetup";

ensureChartSetup();

interface DonutComplianceProps {
  compliant: number;
  warning: number;
  critical: number;
}

export default function DonutCompliance({ compliant, warning, critical }: DonutComplianceProps) {
  const total = Math.max(1, compliant + warning + critical);
  return (
    <div className="donut-wrap">
      <Doughnut
        data={{
          labels: ["Compliant", "Warning", "Critical"],
          datasets: [{
            data: [Math.max(0, compliant), warning, critical],
            backgroundColor: ["#2563eb", "#b45309", "#b91c1c"],
            borderColor: "transparent",
            borderWidth: 0,
            spacing: 4,
            hoverOffset: 6,
          }],
        }}
        options={{
          cutout: "82%",
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: tooltipStyle,
          },
          animation: { animateScale: true, duration: 700, easing: "easeOutQuart" },
        }}
      />
      <div className="donut-center" aria-hidden="true">
        <div className="donut-center-val">{compliant.toLocaleString()}</div>
        <div className="donut-center-lbl">of {total.toLocaleString()} compliant</div>
      </div>
      <div className="donut-legend">
        <span className="donut-legend-item compliant">
          <span className="dot" /> Compliant
        </span>
        <span className="donut-legend-item warning">
          <span className="dot" /> Warning · {warning}
        </span>
        <span className="donut-legend-item critical">
          <span className="dot" /> Critical · {critical}
        </span>
      </div>
    </div>
  );
}
