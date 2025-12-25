"use client";

import "@/lib/chartjs";
import { Line } from "react-chartjs-2";

export default function LineChart({ data }) {
  const labels = data.map((d) => d.x);
  const values = data.map((d) => Number(d.y));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Value",
        data: values,
        fill: true,
        borderColor: "#3b82f6",      // blue-500
        backgroundColor: "rgba(59,130,246,0.2)", // same blue with opacity
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { mode: "index", intersect: false }, legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { drawBorder: false } },
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
