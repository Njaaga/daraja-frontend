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

export default function StackedBarChart({ data = [], xKey, yKeys = [] }) {
  if (!data.length) return <p className="text-red-500 font-bold">❗ No data provided for stacked bar chart.</p>;

  const inferredYKeys =
    yKeys.length > 0 ? yKeys : Object.keys(data[0]).filter((key) => key !== xKey);

  if (!inferredYKeys.length)
    return <p className="text-red-500 font-bold">❗ No numeric fields found to stack.</p>;

  const hexColors = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

  const chartData = {
    labels: data.map((d) => d[xKey]),
    datasets: inferredYKeys.map((key, idx) => ({
      label: key,
      data: data.map((d) => Number(d[key] || 0)),
      backgroundColor: hexColors[idx % hexColors.length],
      borderWidth: 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { drawBorder: false } } },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
