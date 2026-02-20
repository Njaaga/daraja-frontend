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
  onPointClick,
  aggregation = "sum",
  fullscreen = false,
}) {
  const [rawData, setRawData] = useState([]);
  const [xField, setXField] = useState(null);
  const [yField, setYField] = useState(null);
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
          body: JSON.stringify({ filters: backendFilters, selected_fields: selectedFields }),
        });

        const rows = res?.data?.data || [];

        if (!cancelled) {
          setRawData(rows);

          // Auto-detect x/y fields from first row
          const firstRow = rows[0] || {};
          const keys = Object.keys(firstRow);

          // Pick first numeric key as yField, first string key as xField
          let detectedX = keys.find(k => typeof firstRow[k] === "string") || keys[0];
          let detectedY = keys.find(k => typeof firstRow[k] === "number") || keys[1];

          setXField(detectedX);
          setYField(detectedY);
        }

      } catch (err) {
        console.error("ChartRenderer API error:", err);
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [chartId, JSON.stringify(backendFilters), JSON.stringify(selectedFields)]);

  // Map data for charting
  const chartData = useMemo(() => {
    if (!rawData.length || !xField || !yField) return [];

    if (type === "kpi") {
      return rawData.reduce((sum, row) => sum + Number(row[yField] || 0), 0);
    }

    if (type === "stacked_bar") {
      return rawData.map(row => {
        const obj = { x: row[xField] };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => ![xField, yField].includes(k));
        keys.forEach(k => obj[k] = Number(row[k] || 0));
        obj.__row = row;
        return obj;
      });
    }

    return rawData.map(row => ({ x: row[xField], y: Number(row[yField] || 0), __row: row }));
  }, [rawData, xField, yField, type, stackedFields]);

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
      {type === "stacked_bar" && <StackedBarChart data={chartData} xKey="x" yKeys={stackedFields} onBarClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField} />}
    </div>
  );
}
