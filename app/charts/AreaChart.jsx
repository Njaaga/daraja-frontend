"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AreaChart({ data = [], xKey, yKey }) {
  if (!data.length) return <p className="text-red-500 font-bold">❗ No data provided for area chart.</p>;

  const chartData = {
    labels: data.map(d => d[xKey]),
    datasets: [
      {
        label: yKey,
        data: data.map(d => Number(d[yKey] || 0)),
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.3)", // semi-transparent blue
        borderColor: "#3b82f6", // blue line
        tension: 0.4, // smooth curve
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { drawBorder: false } } },
  };

  return (
    <div className="w-full h-[350px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
