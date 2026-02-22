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

  // ----------------------------------
  // Format filters for backend
  // ----------------------------------
  const backendFilters = useMemo(() => {
    if (!filters) return {};
    return Object.fromEntries(
      Object.entries(filters).map(([k, f]) => [
        k,
        { type: f?.type || "text", value: f?.value ?? f },
      ])
    );
  }, [filters]);

  // ----------------------------------
  // Fetch data
  // ----------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await apiClient(`/api/charts/${chartId}/run/`, {
          method: "POST",
          body: JSON.stringify({
            filters: backendFilters,
            selected_fields: selectedFields,
          }),
        });

        const rows = res?.data?.data || [];
        console.log("🔹 ChartRenderer rows:", rows.slice(0, 5));

        if (!cancelled) setRawData(rows);
      } catch (err) {
        console.error("Chart fetch error:", err);
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (chartId) loadData();
    return () => { cancelled = true; };
  }, [chartId, JSON.stringify(backendFilters), JSON.stringify(selectedFields)]);

  // ----------------------------------
  // Prepare chart data
  // ----------------------------------
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    const xKey = xField;
    const yKey = yField || "value";

    // KPI
    if (type === "kpi") {
      return rawData.reduce(
        (sum, r) => sum + Number(r[yKey] || 0),
        0
      );
    }

    // Stacked bar
    if (type === "stacked_bar") {
      return rawData.map(row => {
        const obj = { x: row[xKey] };
        stackedFields.forEach(k => obj[k] = Number(row[k] || 0));
        obj.__row = row;
        return obj;
      });
    }

    // Standard charts
    return rawData.map(row => ({
      x: row[xKey],
      y: Number(row[yKey] || 0),
      __row: row,
    }));
  }, [rawData, xField, yField, type, stackedFields]);

  // ----------------------------------
  // Point click
  // ----------------------------------
  const handlePointClick = payload => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    onPointClick({ row: deepFlatten(original) });
  };

  if (loading) return <div>Loading chart…</div>;
  if (!rawData.length) return <div>No data to display</div>;

  const wrapperClass = fullscreen
    ? "fixed inset-0 bg-white z-50 p-6 overflow-auto"
    : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "stacked_bar" && (
        <StackedBarChart
          data={chartData}
          xKey="x"
          yKeys={stackedFields}
          onBarClick={handlePointClick}
        />
      )}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField || "value"} />}
    </div>
  );
}
