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
  stackedFields = [],
  filters = {},
  selectedFields = null,
  xField = null,
  yField = null,
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

  // Fetch aggregated chart data
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

        // 🔹 DEBUG logs
        console.log("🔹 ChartRenderer DEBUG: raw API response:", res);
        const rows = res?.data?.data || [];
        console.log("🔹 ChartRenderer DEBUG: processed rows:", rows);

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

  // Prepare chart data dynamically
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    // Determine which keys to use
    const xKey = rawData[0]?.x !== undefined ? "x" : xField;
    const yKey = rawData[0]?.y !== undefined ? "y" : yField;

    if (type === "kpi") {
      return rawData.reduce((sum, row) => sum + Number(row[yKey] || 0), 0);
    }

    if (type === "stacked_bar") {
      return rawData.map(row => {
        const obj = { x: row[xKey] };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => ![xKey, yKey].includes(k));
        keys.forEach(k => obj[k] = Number(row[k] || 0));
        obj.__row = row;
        return obj;
      });
    }

    return rawData.map(row => ({
      x: row[xKey],
      y: Number(row[yKey] || 0),
      __row: row,
    }));
  }, [rawData, type, stackedFields, xField, yField]);

  const handlePointClick = (payload) => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    onPointClick({ row: deepFlatten(original) });
  };

  if (loading) return <div>Loading chart…</div>;
  if (!rawData.length) return <div>No data to display</div>;

  const wrapperClass = fullscreen ? "fixed inset-0 bg-white z-50 p-6 overflow-auto" : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "stacked_bar" && <StackedBarChart data={chartData} xKey="x" yKeys={stackedFields} onBarClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField || "y"} />}
    </div>
  );
}
