"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
import { deepFlatten } from "@/lib/utils";

import LineChart from "@/app/charts/LineChart";
import BarChart from "@/app/charts/BarChart";
import PieChart from "@/app/charts/PieChart";
import StackedBarChart from "@/app/charts/StackedBarChart";
import AreaChart from "@/app/charts/AreaChart";
import ScatterChart from "@/app/charts/ScatterChart";
import KPI from "@/app/charts/KPI";

/* ------------------ HELPERS ------------------ */
function getValue(row, field) {
  if (!field) return undefined;
  return field.includes(".")
    ? field.split(".").reduce((a, k) => a?.[k], row)
    : row[field];
}

/* ------------------ COMPONENT ------------------ */
export default function ChartRenderer({
  datasetId,
  type,
  xField,
  yField,
  stackedFields = [],
  filters = {},
  excelData = null,
  logicRules = [],
  selectedFields = null,
  onPointClick,
  fullscreen = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------- LOAD DATA -------- */
  useEffect(() => {
    if (!datasetId) {
      setRows(Array.isArray(excelData) ? excelData : []);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await apiClient(`/api/datasets/${datasetId}/run/`, {
          method: "POST",
        });

        // ✅ CRITICAL FIX: unwrap aggregated response
        const payload =
          Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res)
            ? res
            : [];

        setRows(payload);
      } catch (err) {
        console.error("Dataset load failed", err);
        setRows([]);
      }
      setLoading(false);
    };

    load();
  }, [datasetId, excelData]);

  /* -------- FILTERING -------- */
  const filteredData = useMemo(() => {
    let output = [...rows];

    // basic filters (unchanged)
    Object.entries(filters || {}).forEach(([field, rule]) => {
      if (!rule?.value) return;
      output = output.filter(r =>
        String(getValue(r, field)).includes(String(rule.value))
      );
    });

    if (selectedFields?.length) {
      output = output.map(r => {
        const o = {};
        selectedFields.forEach(f => (o[f] = getValue(r, f)));
        return o;
      });
    }

    return output;
  }, [rows, filters, selectedFields]);

  /* -------- CHART DATA -------- */
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    // KPI
    if (type === "kpi") {
      return filteredData.reduce(
        (sum, r) => sum + Number(getValue(r, yField) ?? r.value ?? 0),
        0
      );
    }

    // Stacked bar
    if (type === "stacked_bar") {
      return filteredData.map(r => {
        const obj = { x: getValue(r, xField) };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(r).filter(k => k !== xField);
        keys.forEach(k => (obj[k] = Number(r[k] || 0)));
        obj.__row = r;
        return obj;
      });
    }

    // Aggregated or normal XY charts
    return filteredData.map(r => ({
      x: getValue(r, xField),
      y: Number(
        yField
          ? getValue(r, yField)
          : r.value ?? 1 // ✅ COUNT SUPPORT
      ),
      __row: r,
    }));
  }, [filteredData, type, xField, yField, stackedFields]);

  /* -------- CLICK -------- */
  const handlePointClick = payload => {
    if (!onPointClick) return;
    const row = payload?.__row || payload;
    onPointClick({ row: deepFlatten(row) });
  };

  /* -------- RENDER -------- */
  if (loading) return <div>Loading dataset…</div>;
  if (!filteredData.length) return <div>No matching data</div>;

  const wrapper = fullscreen
    ? "fixed inset-0 bg-white z-50 p-6 overflow-auto"
    : "";

  return (
    <div className={wrapper}>
      {type === "line" && <LineChart data={chartData} onPointClick={handlePointClick} />}
      {type === "bar" && <BarChart data={chartData} onBarClick={handlePointClick} />}
      {type === "pie" && <PieChart data={chartData} onSliceClick={handlePointClick} />}
      {type === "area" && <AreaChart data={chartData} onPointClick={handlePointClick} />}
      {type === "scatter" && <ScatterChart data={chartData} onPointClick={handlePointClick} />}
      {type === "kpi" && <KPI value={chartData} label={yField || "Count"} />}
      {type === "stacked_bar" && (
        <StackedBarChart
          data={chartData}
          xKey={xField}
          yKeys={stackedFields}
          onBarClick={handlePointClick}
        />
      )}
    </div>
  );
}
