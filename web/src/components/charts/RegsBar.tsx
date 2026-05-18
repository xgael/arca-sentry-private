"use client";

import { Bar } from "react-chartjs-2";
import { REG_LABELS, REG_COLORS } from "@/lib/format";
import { ensureChartSetup, tooltipStyle } from "./ChartSetup";
import type { Regulation } from "@/lib/api";

ensureChartSetup();

interface RegsBarProps {
  items: Array<{ regulation: Regulation; count: number }>;
}

export default function RegsBar({ items }: RegsBarProps) {
  return (
    <Bar
      data={{
        labels: items.map((i) => REG_LABELS[i.regulation] ?? i.regulation),
        datasets: [{
          data: items.map((i) => i.count),
          backgroundColor: items.map((i) => REG_COLORS[i.regulation] ?? "#888"),
          borderWidth: 0,
          borderRadius: 6,
          maxBarThickness: 24,
        }],
      }}
      options={{
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, grid: { color: "#d8e0ed" }, ticks: { precision: 0, font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: 500 } } },
        },
        plugins: { legend: { display: false }, tooltip: tooltipStyle },
        animation: { duration: 600 },
      }}
    />
  );
}
