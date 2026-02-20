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

/* ===================== CHART RENDERER ===================== */
export default function ChartRenderer({
  chartId,
  type,
  stackedFields = [],
  filters = {},
  selectedFields = null,
  onPointClick,
  fullscreen = false,
}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===================== FORMAT FILTERS FOR BACKEND ===================== */
  const backendFilters = useMemo(() => {
    if (!filters) return {};
    return Object.fromEntries(
      Object.entries(filters).map(([k, f]) => [
        k,
        { type: f?.type || "text", value: f?.value ?? f },
      ])
    );
  }, [filters]);

  /* ===================== FETCH AGGREGATED DATA ===================== */
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
    return () => {
      cancelled = true;
    };
  }, [chartId, JSON.stringify(backendFilters), JSON.stringify(selectedFields)]);

  /* ===================== PREPARE CHART DATA ===================== */
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    if (type === "kpi") {
      return rawData.reduce((sum, row) => sum + Number(row.y || 0), 0);
    }

    if (type === "stacked_bar") {
      return rawData.map(row => {
        const obj = { x: row.x };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => !["x", "y"].includes(k));

        keys.forEach(k => {
          obj[k] = Number(row[k] || 0);
        });

        obj.__row = row;
        return obj;
      });
    }

    // For line/bar/pie/area/scatter
    return rawData.map(row => ({
      x: row.x,
      y: Number(row.y || 0),
      __row: row,
    }));
  }, [rawData, type, stackedFields]);

  /* ===================== POINT CLICK ===================== */
  const handlePointClick = (payload) => {
    if (!onPointClick || !payload) return;
    const original = payload.__row || payload;
    const flattened = deepFlatten(original);
    onPointClick({ row: flattened });
  };

  /* ===================== RENDER ===================== */
  if (loading) return <div>Loading chart…</div>;
  if (!rawData.length) return <div>No data to display</div>;

  const wrapperClass = fullscreen ? "fixed inset-0 bg-white z-50 p-6 overflow-auto" : "";

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
      {type === "kpi" && <KPI value={chartData} label="y" />}
    </div>
  );
}
