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

  // -----------------------------
  // KPI
  // -----------------------------
  if (response.type === "kpi") {
    return <KPI value={response.value || 0} label={response.field || "Value"} />;
  }

  // -----------------------------
  // RAW DATA NORMALIZATION
  // -----------------------------
  let rawData = [];

  if (response.type === "chart" && Array.isArray(response.data)) {
    rawData = response.data.map(d => ({
      x: d.label,
      y: Number(d.value || 0),
    }));
  } else if (response.type === "table" && Array.isArray(response.data)) {
    rawData = response.data;
  } else if (Array.isArray(response)) {
    rawData = response;
  }

  if (!rawData.length) return <div>No data returned</div>;

  // -----------------------------
  // AUTO DETECT X & Y FIELDS
  // -----------------------------
  const chartData = useMemo(() => {
    // Already normalized
    if (rawData[0]?.x !== undefined && rawData[0]?.y !== undefined) return rawData;

    const keys = Object.keys(rawData[0]);

    const numericKey = keys.find(k => rawData.some(r => typeof r[k] === "number"));
    const stringKey = keys.find(k => rawData.some(r => typeof r[k] === "string"));

    if (!numericKey) return [];

    return rawData.map(row => ({
      x: stringKey ? row[stringKey] : "Value",
      y: Number(row[numericKey] || 0),
    }));
  }, [rawData]);

  if (!chartData.length) return <div>No chartable data</div>;

  // -----------------------------
  // RENDER CHART
  // -----------------------------
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
