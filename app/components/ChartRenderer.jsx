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
  xField = null,
  yField = null,
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

        console.log("🔹 ChartRenderer DEBUG: full API response", res);

        // Flexible extraction of rows
        const rows =
          Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.data?.data) ? res.data.data :
          Array.isArray(res?.results) ? res.results :
          [];

        if (!cancelled) {
          setRawData(rows);
          console.log("🔹 ChartRenderer DEBUG: first 5 rows", rows.slice(0, 5));
        }
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

  // Detect x/y fields if not passed
  const detectedXField = useMemo(() => {
    if (xField) return xField;
    return rawData[0] ? Object.keys(rawData[0])[0] : null;
  }, [rawData, xField]);

  const detectedYField = useMemo(() => {
    if (yField) return yField;
    if (!rawData[0]) return null;
    const keys = Object.keys(rawData[0]).filter(k => k !== detectedXField);
    return keys[0] || null;
  }, [rawData, yField, detectedXField]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!rawData.length) return [];

    if (type === "kpi") {
      return rawData.reduce(
        (sum, row) => sum + Number(row[detectedYField] || 0),
        0
      );
    }

    if (type === "stacked_bar") {
      return rawData.map(row => {
        const obj = { x: row[detectedXField] };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => ![detectedXField].includes(k));

        keys.forEach(k => obj[k] = Number(row[k] || 0));
        obj.__row = row;
        return obj;
      });
    }

    return rawData.map(row => ({
      x: row[detectedXField],
      y: Number(row[detectedYField] || 0),
      __row: row,
    }));
  }, [rawData, type, stackedFields, detectedXField, detectedYField]);

  // Point click handler
  const handlePointClick = (payload) => {
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
      {type === "stacked_bar" && (
        <StackedBarChart
          data={chartData}
          xKey="x"
          yKeys={stackedFields.length ? stackedFields : Object.keys(chartData[0] || {}).filter(k => k !== "x")}
          onBarClick={handlePointClick}
        />
      )}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={detectedYField} />}
    </div>
  );
}
