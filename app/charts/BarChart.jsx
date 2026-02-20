"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data = [], onBarClick }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data to display</p>;
  }

  // ✅ Explicit keys (no guessing)
  const labels = data.map((row) => row.x);
  const values = data.map((row) => Number(row.y ?? 0));

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
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
    onClick: (_evt, elements) => {
      if (!elements.length || !onBarClick) return;

      const index = elements[0].index;
      const row = data[index];

      onBarClick({
        field: "y",
        value: row.y,
        row,
      });
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
