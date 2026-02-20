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

  // Fetch chart data
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

        console.log("🔹 ChartRenderer DEBUG: raw API response:", res);

        const rows = res?.data?.data || [];
        console.log("🔹 ChartRenderer DEBUG: processed rows (first 5):", rows.slice(0, 5));

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
  // Prepare chart data (DEBUG MODE)
  // -----------------------
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    console.log("🔹 ChartRenderer DEBUG: rawData full sample (first 5):", rawData.slice(0, 5));

    // KPI charts
    if (type === "kpi") {
      const sum = rawData.reduce((acc, row) => acc + Number(row[yField] || 0), 0);
      console.log("🔹 KPI chart value:", sum);
      return sum;
    }

    // Stacked bar
    if (type === "stacked_bar") {
      const data = rawData.map(row => {
        const obj = { x: row[xField] ?? row[Object.keys(row)[0]] }; // fallback
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => ![xField, yField].includes(k));
        keys.forEach(k => obj[k] = Number(row[k] || 0));
        obj.__row = row;
        return obj;
      });
      console.log("🔹 Stacked bar chart data (first 5):", data.slice(0, 5));
      return data;
    }

    // Other charts (line/bar/pie/area/scatter)
    const data = rawData.map(row => {
      const xVal = row[xField] ?? row[Object.keys(row)[0]]; // fallback
      const yVal = Number(row[yField] ?? row[Object.keys(row)[1]] || 0);
      return { x: xVal, y: yVal, __row: row };
    });
    console.log(`🔹 ${type} chart data (first 5):`, data.slice(0, 5));
    return data;
  }, [rawData, xField, yField, type, stackedFields]);

  // -----------------------
  // Point click handler
  // -----------------------
  const handlePointClick = payload => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    const flattened = deepFlatten(original);
    onPointClick({ row: flattened });
  };

  if (loading) return <div>Loading chart…</div>;
  if (!rawData.length) return (
    <div style={{ color: "red", fontWeight: "bold" }}>
      No data to display — check browser console for debug logs
    </div>
  );

  const wrapperClass = fullscreen ? "fixed inset-0 bg-white z-50 p-6 overflow-auto" : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "stacked_bar" && <StackedBarChart data={chartData} xKey="x" yKeys={stackedFields} onBarClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField} />}
    </div>
  );
}
