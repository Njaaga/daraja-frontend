"use client";

import "@/lib/chartjs";
import { Doughnut } from "react-chartjs-2";
import { deepFlatten } from "@/lib/utils";

export default function PieChart({ data, onSliceClick }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data to display</p>;
  }

  /**
   * EXPECTED backend rows:
   * [
   *   { x: "Expense", y: 1200, ... },
   *   { x: "Expense", y: 300, ... },
   *   { x: "Liability", y: 450, ... }
   * ]
   */

  // ----------------------------------
  // HARD AGGREGATION (CRITICAL)
  // ----------------------------------
  const aggregated = {};

  for (const row of data) {
    const label = row.x;
    const value = Number(row.y ?? 0);

    if (!label || isNaN(value)) continue;

    if (!aggregated[label]) {
      aggregated[label] = {
        label,
        value: 0,
        rows: [],
      };
    }

    aggregated[label].value += value;
    aggregated[label].rows.push(deepFlatten(row));
  }

  const slices = Object.values(aggregated);

  if (!slices.length) {
    return (
      <p className="text-red-500 font-bold">
        ❗ Pie Chart requires numeric Y values.
      </p>
    );
  }

  // ----------------------------------
  // CHART CONFIG
  // ----------------------------------
  const colors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
  ];

  const chartData = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: colors.slice(0, slices.length),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.raw,
        },
      },
    },
    onClick: (_evt, elements) => {
      if (!elements.length) return;

      const index = elements[0].index;
      const slice = slices[index];

      if (onSliceClick) {
        onSliceClick({
          x: slice.label,
          y: slice.value,
          __rows: slice.rows, // ALL underlying QB rows
        });
      }
    },
  };

  return (
    <div className="w-full h-[350px] flex justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
