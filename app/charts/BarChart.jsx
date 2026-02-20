"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data</p>;
  }

  const labels = data.map(d => d.x);
  const values = data.map(d => d.y);

  return (
    <div className="w-full h-[350px]">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Value",
              data: values,
              backgroundColor: "#10b981",
              borderRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true },
          },
        }}
      />
    </div>
  );
}
