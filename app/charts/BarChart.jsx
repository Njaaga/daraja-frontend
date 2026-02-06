"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data, onBarClick }) {
  const labels = data.map((d) => d.x);
  const values = data.map((d) => Number(d.y));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Value",
        data: values,
        borderRadius: 6,
        maxBarThickness: 40,
        backgroundColor: "#10b981",
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
    onClick: (evt, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      if (onBarClick) onBarClick(data[index]);
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
