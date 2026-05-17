"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = "#5a6b85";

const tooltipStyle = {
  backgroundColor: "rgba(11, 26, 51, 0.95)",
  titleColor: "#fff",
  titleFont: { size: 11, weight: 700 as const },
  bodyColor: "#cfdcef",
  bodyFont: { size: 11 },
  padding: 10,
  cornerRadius: 6,
  displayColors: true,
  boxPadding: 4,
};

export function DonutChart({
  compliant,
  warning,
  critical,
}: {
  compliant: number;
  warning: number;
  critical: number;
}) {
  const data = useMemo(
    () => ({
      labels: ["Compliant", "Warning", "Critical"],
      datasets: [
        {
          data: [compliant, warning, critical],
          backgroundColor: ["#15803d", "#b45309", "#b91c1c"],
          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [compliant, warning, critical],
  );
  const options: ChartOptions<"doughnut"> = {
    cutout: "70%",
    plugins: {
      legend: { position: "bottom", labels: { padding: 14, usePointStyle: true, pointStyle: "circle" } },
      tooltip: tooltipStyle,
    },
    maintainAspectRatio: false,
    animation: { animateScale: true, duration: 700, easing: "easeOutQuart" },
  };
  return <Doughnut data={data} options={options} />;
}

export function TimelineChart({
  labels,
  interactions,
  warnings,
  criticals,
}: {
  labels: string[];
  interactions: number[];
  warnings: number[];
  criticals: number[];
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Interactions",
          data: interactions,
          borderColor: "#2563eb",
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "rgba(37, 99, 235, 0.1)";
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(37, 99, 235, 0.32)");
            g.addColorStop(1, "rgba(37, 99, 235, 0)");
            return g;
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
    }),
    [labels, interactions, warnings, criticals],
  );
  const options: ChartOptions<"line"> = {
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
  };
  return <Line data={data} options={options} />;
}

export function RegBarChart({
  items,
}: {
  items: Array<{ label: string; count: number; color: string }>;
}) {
  const data = useMemo(
    () => ({
      labels: items.map((i) => i.label),
      datasets: [
        {
          data: items.map((i) => i.count),
          backgroundColor: items.map((i) => i.color),
          borderWidth: 0,
          borderRadius: 6,
          maxBarThickness: 24,
        },
      ],
    }),
    [items],
  );
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    scales: {
      x: { beginAtZero: true, grid: { color: "#d8e0ed" }, ticks: { precision: 0, font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: 500 } } },
    },
    plugins: { legend: { display: false }, tooltip: tooltipStyle },
    animation: { duration: 600 },
  };
  return <Bar data={data} options={options} />;
}

export function SparkLine({ data }: { data: number[] }) {
  const cfg = useMemo(
    () => ({
      labels: data.map((_, i) => i.toString()),
      datasets: [
        {
          data,
          borderColor: "#2563eb",
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "rgba(37, 99, 235, 0)";
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(37, 99, 235, 0.4)");
            g.addColorStop(1, "rgba(37, 99, 235, 0)");
            return g;
          },
          tension: 0.4,
          fill: true,
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    }),
    [data],
  );
  const options: ChartOptions<"line"> = {
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    maintainAspectRatio: false,
    animation: { duration: 500 },
  };
  return <Line data={cfg} options={options} />;
}
