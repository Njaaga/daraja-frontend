"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
import LineChart from "@/app/charts/LineChart";
import BarChart from "@/app/charts/BarChart";
import PieChart from "@/app/charts/PieChart";
import StackedBarChart from "@/app/charts/StackedBarChart";
import AreaChart from "@/app/charts/AreaChart";
import ScatterChart from "@/app/charts/ScatterChart";
import KPI from "@/app/charts/KPI";
import { deepFlatten } from "@/lib/utils";

export default function ChartRenderer({
  chartId,
  type,
  xField,
  yField,
  stackedFields = [],
  filters = {},
  selectedFields = null,
  onPointClick,
  fullscreen = false,
}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format filters for backend
  const backendFilters = useMemo(() => {
    if (!filters) return {};
    return Object.fromEntries(
      Object.entries(filters).map(([k, f]) => [
        k,
        { type: f?.type || "text", value: f?.value ?? f },
      ])
    );
  }, [filters]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        if (!chartId) return;

        const res = await apiClient(`/api/charts/${chartId}/run/`, {
          method: "POST",
          body: JSON.stringify({
            filters: backendFilters,
            selected_fields: selectedFields,
          }),
        });

        const rows = res?.data?.data || [];
        console.log("🔹 ChartRenderer DEBUG: raw API rows:", rows.slice(0, 5));
        if (!cancelled) setRawData(rows);
      } catch (err) {
        console.error("🔹 ChartRenderer DEBUG: API fetch error", err);
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [chartId, JSON.stringify(backendFilters), JSON.stringify(selectedFields)]);

  // -----------------------
  // Prepare chart data
  // -----------------------
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    // Auto-pick X: first string field if xField missing
    const pickXField = xField || Object.keys(rawData[0]).find(k => typeof rawData[0][k] === "string") || Object.keys(rawData[0])[0];

    // Auto-pick Y: first numeric field if yField missing
    const pickYField = yField || Object.keys(rawData[0]).find(k => typeof rawData[0][k] === "number") || null;

    const data = rawData.map(row => {
      let xVal = row[pickXField];
      if (xVal == null) xVal = Object.values(row)[0];

      let yVal;
      if (pickYField && !isNaN(Number(row[pickYField]))) {
        yVal = Number(row[pickYField]);
      } else {
        yVal = 1; // fallback count for non-numeric
      }

      const obj = { x: xVal, y: yVal, __row: row };
      return obj;
    });

    console.log("🔹 ChartRenderer DEBUG: processed chartData:", data.slice(0, 5));
    return data;
  }, [rawData, xField, yField]);

  const handlePointClick = payload => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    const flattened = deepFlatten(original);
    onPointClick({ row: flattened });
  };

  if (loading) return <div>Loading chart…</div>;
  if (!chartData.length) return <div>No data to display</div>;

  const wrapperClass = fullscreen ? "fixed inset-0 bg-white z-50 p-6 overflow-auto" : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "stacked_bar" && <StackedBarChart data={chartData} xKey="x" yKeys={stackedFields.length ? stackedFields : ["y"]} onBarClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData.reduce((sum, r) => sum + r.y, 0)} label={pickYField} />}
    </div>
  );
}
