"use client";

import React from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

export default function ScatterChart({ data = [], xKey, yKey }) {
  if (!data.length) return <p className="text-red-500 font-bold">❗ No data provided for scatter chart.</p>;

  const chartData = {
    datasets: [
      {
        label: yKey,
        data: data.map(d => ({ x: Number(d[xKey] || 0), y: Number(d[yKey] || 0) })),
        backgroundColor: "#10b981", // green points
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, tooltip: { mode: "nearest", intersect: true } },
    scales: { x: { title: { display: true, text: xKey } }, y: { title: { display: true, text: yKey } } },
  };

  return (
    <div className="w-full h-[350px]">
      <Scatter data={chartData} options={options} />
    </div>
  );
}
