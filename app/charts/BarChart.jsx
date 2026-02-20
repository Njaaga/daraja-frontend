"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data, onBarClick }) {
  if (!data || !data.length) return <p>No data</p>;

  const labels = data.map(d => d.x);
  const values = data.map(d => Number(d.y) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} />
    </div>
  );
}
