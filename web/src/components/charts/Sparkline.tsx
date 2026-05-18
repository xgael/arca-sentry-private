"use client";

import { Line } from "react-chartjs-2";
import { ensureChartSetup } from "./ChartSetup";

ensureChartSetup();

interface SparklineProps {
  labels: string[];
  values: number[];
}

export default function Sparkline({ labels, values }: SparklineProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [{
          data: values,
          borderColor: "#2563eb",
          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const c = ctx.chart.ctx.createLinearGradient(0, 0, 0, 40);
            c.addColorStop(0, "rgba(37, 99, 235, 0.4)");
            c.addColorStop(1, "rgba(37, 99, 235, 0)");
            return c;
          },
          tension: 0.4,
          fill: true,
          borderWidth: 1.5,
          pointRadius: 0,
        }],
      }}
      options={{
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        maintainAspectRatio: false,
        animation: { duration: 500 },
      }}
    />
  );
}
