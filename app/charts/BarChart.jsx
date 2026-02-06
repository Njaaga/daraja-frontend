"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data, onBarClick }) {
  if (!data || !data.length) return <p>No data to display</p>;

  // Dynamically detect x and y fields from first row
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const xKey = keys[0]; // first key as x-axis
  const yKey = keys[1] ?? keys[0]; // second key as y-axis or first if only one

  const labels = data.map((d) => d[xKey]);
  const values = data.map((d) => Number(d[yKey] ?? 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: yKey,
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
    onClick: (_evt, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const row = data[index];
      if (!row) return;

      // Send full row object to modal
      if (onBarClick) onBarClick({ field: yKey, value: row[yKey], row });
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
