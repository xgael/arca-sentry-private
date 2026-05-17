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
  return (
    <Doughnut
      data={{
        labels: ["Compliant", "Warning", "Critical"],
        datasets: [{
          data: [Math.max(0, compliant), warning, critical],
          backgroundColor: ["#15803d", "#b45309", "#b91c1c"],
          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 8,
        }],
      }}
      options={{
        cutout: "70%",
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { padding: 14, usePointStyle: true, pointStyle: "circle" } },
          tooltip: tooltipStyle,
        },
        animation: { animateScale: true, duration: 700, easing: "easeOutQuart" },
      }}
    />
  );
}
