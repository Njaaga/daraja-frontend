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
  xField,
  yField,
  onPointClick,
  fullscreen = false,
}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------- FETCH DATA --------------------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        if (!chartId) return;

        const res = await apiClient(`/api/charts/${chartId}/run/`, {
          method: "POST",
          body: JSON.stringify({ filters }),
        });

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
  }, [chartId, JSON.stringify(filters)]);

  // -------------------- PREPARE CHART DATA --------------------
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    if (type === "kpi") {
      return rawData.reduce((sum, row) => sum + Number(row[yField] || 0), 0);
    }

    if (type === "stacked_bar") {
      return rawData.map(row => ({
        x: row[xField],
        ...stackedFields.reduce((acc, f) => { acc[f] = row[f] ?? 0; return acc; }, {}),
        __row: row
      }));
    }

    return rawData.map(row => ({
      x: row[xField],
      y: Number(row[yField] || 0),
      __row: row
    }));
  }, [rawData, type, xField, yField, stackedFields]);

  // -------------------- CLICK HANDLER --------------------
  const handlePointClick = (payload) => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    const flattened = deepFlatten(original);
    onPointClick({ row: flattened });
  };

  if (loading) return <div>Loading chart…</div>;
  if (!rawData.length) return <div>No data to display</div>;

  const wrapperClass = fullscreen ? "fixed inset-0 bg-white z-50 p-6 overflow-auto" : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "stacked_bar" && <StackedBarChart data={chartData} xKey={xField} yKeys={stackedFields} onBarClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField} />}
    </div>
  );
}
