"use client";

import "@/lib/chartjs";
import { Bar } from "react-chartjs-2";

export default function BarChart({ data, onBarClick }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data to display</p>;
  }

  /**
   * EXPECTED backend shape:
   * [
   *   { x: "Expense", y: 1200 },
   *   { x: "Liability", y: 450 }
   * ]
   */

  // ----------------------------------
  // HARD DEDUPLICATION (CRITICAL)
  // ----------------------------------
  const aggregated = {};

  for (const row of data) {
    const x = row.x;
    const y = Number(row.y ?? 0);

    if (!x) continue;

    if (!aggregated[x]) {
      aggregated[x] = 0;
    }

    aggregated[x] += y;
  }

  const labels = Object.keys(aggregated);
  const values = Object.values(aggregated);

  // ----------------------------------
  // CHART CONFIG
  // ----------------------------------
  const chartData = {
    labels,
    datasets: [
      {
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
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.raw,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
    onClick: (_evt, elements) => {
      if (!elements.length) return;

      const index = elements[0].index;
      const label = labels[index];
      const value = values[index];

      if (onBarClick) {
        onBarClick({
          field: "x",
          value: label,
          total: value,
        });
      }
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
