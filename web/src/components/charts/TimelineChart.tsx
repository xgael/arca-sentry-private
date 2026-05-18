"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ensureChartSetup, tooltipStyle } from "./ChartSetup";

ensureChartSetup();

interface TimelineChartProps {
  labels: string[];
  interactions: number[];
  warnings: number[];
  criticals: number[];
}

export default function TimelineChart({ labels, interactions, warnings, criticals }: TimelineChartProps) {
  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Interactions",
        data: interactions,
        borderColor: "#2563eb",
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const c = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
          c.addColorStop(0, "rgba(37, 99, 235, 0.32)");
          c.addColorStop(1, "rgba(37, 99, 235, 0.0)");
          return c;
        },
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Warnings",
        data: warnings,
        borderColor: "#b45309",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Critical",
        data: criticals,
        borderColor: "#b91c1c",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }), [labels, interactions, warnings, criticals]);

  return (
    <Line
      data={data}
      options={{
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        scales: {
          y: { beginAtZero: true, grid: { color: "#d8e0ed" }, ticks: { precision: 0, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
        },
        plugins: {
          legend: { position: "top", align: "end", labels: { boxWidth: 8, boxHeight: 8, padding: 12 } },
          tooltip: tooltipStyle,
        },
        animation: { duration: 600, easing: "easeOutCubic" },
      }}
    />
  );
}
