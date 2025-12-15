"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StackedBarChart({ data, xKey, yKeys = [] }) {
  const chartData = {
    labels: data.map(d => d[xKey]),
    datasets: yKeys.map((key, idx) => ({
      label: key,
      data: data.map(d => d[key] || 0),
      backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  return <Bar data={chartData} options={options} />;
}
