"use client";

import React, { useMemo } from "react";
import LineChart from "@/app/charts/LineChart";
import BarChart from "@/app/charts/BarChart";
import PieChart from "@/app/charts/PieChart";
import AreaChart from "@/app/charts/AreaChart";
import ScatterChart from "@/app/charts/ScatterChart";
import StackedBarChart from "@/app/charts/StackedBarChart";
import KPI from "@/app/charts/KPI";

/* ---------------- ChartRenderer ---------------- */
export default function ChartRenderer({ response, chartType }) {
  if (!response) return <div>No data</div>;

  // ---------------- KPI ----------------
  if (response.type === "kpi") {
    return <KPI value={response.value} label={response.field} />;
  }

  // ---------------- TABLE ----------------
  if (response.type === "table") {
    return <div>Table returned {response.count} rows</div>;
  }

  // ---------------- CHART ----------------
  if (response.type !== "chart") {
    return <div>Unsupported response</div>;
  }

  const data = response.data.map(d => ({
    x: d.label,
    y: d.value,
  }));

  if (!data.length) return <div>No chart data</div>;

  switch (chartType) {
    case "line":
      return <LineChart data={data} />;
    case "bar":
      return <BarChart data={data} />;
    case "pie":
      return <PieChart data={data} />;
    case "area":
      return <AreaChart data={data} />;
    case "scatter":
      return <ScatterChart data={data} />;
    case "stacked_bar":
      return <StackedBarChart data={data} xKey="x" yKeys={["y"]} />;
    default:
      return <div>Unsupported chart type</div>;
  }
}
