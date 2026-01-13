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

ChartJS.register(
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
);

export default function ScatterChart({ data = [], xKey, yKey }) {
  if (!data.length)
    return (
      <p className="text-red-500 font-bold">
        ❗ No data provided for scatter chart.
      </p>
    );

  if (!xKey || !yKey)
    return (
      <p className="text-red-500 font-bold">
        ❗ xKey and yKey are required for scatter chart.
      </p>
    );

  const chartData = {
    datasets: [
      {
        label: `${yKey} vs ${xKey}`,
        data: data.map((d) => ({
          x: Number(d[xKey]),
          y: Number(d[yKey]),
        })),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "nearest", intersect: true },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: xKey },
        grid: { drawBorder: false },
      },
      y: {
        title: { display: true, text: yKey },
        beginAtZero: true,
        grid: { drawBorder: false },
      },
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Scatter data={chartData} options={options} />
    </div>
  );
}
