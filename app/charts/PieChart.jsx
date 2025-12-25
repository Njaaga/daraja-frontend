"use client";

import "@/lib/chartjs";
import { Doughnut } from "react-chartjs-2";

export default function PieChart({ data }) {
  const processed = data
    .map((row) => ({ label: row.x, value: Number(row.y) }))
    .filter((row) => !isNaN(row.value));

  if (!processed.length)
    return <p className="text-red-500 font-bold">❗ Pie Chart requires numeric Y values.</p>;

  const hexColors = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

  const chartData = {
    labels: processed.map((d) => d.label),
    datasets: [{ data: processed.map((d) => d.value), backgroundColor: hexColors }],
  };

  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };

  return (
    <div className="w-full h-[350px] flex justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
