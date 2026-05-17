"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  BarController,
  CategoryScale,
  DoughnutController,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

let initialized = false;

export function ensureChartSetup() {
  if (initialized) return;
  ChartJS.register(
    ArcElement,
    BarElement,
    BarController,
    CategoryScale,
    DoughnutController,
    Filler,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
  );
  ChartJS.defaults.font.family = "'Inter', sans-serif";
  ChartJS.defaults.font.size = 11;
  ChartJS.defaults.color = "#5a6b85";
  initialized = true;
}

export const tooltipStyle = {
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
