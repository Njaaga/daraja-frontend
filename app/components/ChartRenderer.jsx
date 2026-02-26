"use client";

import React, { useMemo } from "react";
import LineChart from "@/app/charts/LineChart";
import BarChart from "@/app/charts/BarChart";
import PieChart from "@/app/charts/PieChart";
import AreaChart from "@/app/charts/AreaChart";
import ScatterChart from "@/app/charts/ScatterChart";
import StackedBarChart from "@/app/charts/StackedBarChart";
import KPI from "@/app/charts/KPI";

export default function ChartRenderer({ response, chartType }) {
  if (!response) return <div>No data</div>;

  // ---------------- KPI ----------------
  if (response.type === "kpi") {
    return <KPI value={response.value || 0} label={response.field || "Value"} />;
  }

  // ---------------- NORMALIZE DATA ----------------
  let chartData = [];

  if (response.type === "chart" && Array.isArray(response.data)) {
    chartData = response.data.map(d => ({
      x: d.label ?? d.x,
      y: Number(d.value ?? d.y ?? 0),
    }));
  } else if (response.type === "table" && Array.isArray(response.data)) {
    // Pick first numeric column as y, first string column as x
    const firstRow = response.data[0];
    if (!firstRow) return <div>No data returned</div>;
    const keys = Object.keys(firstRow);
    const yKey = keys.find(k => typeof firstRow[k] === "number");
    const xKey = keys.find(k => typeof firstRow[k] === "string") || keys[0];
    if (!yKey) return <div>No numeric data for chart</div>;

    chartData = response.data.map(r => ({
      x: r[xKey],
      y: Number(r[yKey] ?? 0),
    }));
  }

  if (!chartData.length) return <div>No chartable data</div>;

  // ---------------- RENDER ----------------
  switch (chartType) {
    case "line":
      return <LineChart data={chartData} />;
    case "bar":
      return <BarChart data={chartData} />;
    case "pie":
      return <PieChart data={chartData} />;
    case "area":
      return <AreaChart data={chartData} />;
    case "scatter":
      return <ScatterChart data={chartData} />;
    case "stacked_bar":
      return <StackedBarChart data={chartData} xKey="x" yKeys={["y"]} />;
    default:
      return <BarChart data={chartData} />;
  }
}
