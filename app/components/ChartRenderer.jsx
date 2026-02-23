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

/* -------------------- Helpers -------------------- */

function getValue(row, field) {
  if (!field) return undefined;

  if (row?.[field] !== undefined) return row[field];

  if (field.includes(".")) {
    return field.split(".").reduce((acc, key) => acc?.[key], row);
  }

  return undefined;
}

function unwrapResponse(res) {
  // Handles ALL possible backend response shapes safely
  if (Array.isArray(res)) return res;

  if (Array.isArray(res?.data)) return res.data;

  if (Array.isArray(res?.data?.data)) return res.data.data;

  if (Array.isArray(res?.results)) return res.results;

  return [];
}

/* -------------------- Component -------------------- */

export default function ChartRenderer({
  datasetId,
  type,
  xField,
  yField,
  stackedFields = [],
  filters = {},
  excelData = null,
  selectedFields = null,
  onPointClick,
  fullscreen = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------- Load Data -------- */
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

        console.log("FULL API RESPONSE:", res);

        const payload = unwrapResponse(res);

        console.log("UNWRAPPED PAYLOAD:", payload);

        setRows(payload);
      } catch (err) {
        console.error("Dataset load failed:", err);
        setRows([]);
      }

      setLoading(false);
    };

    load();
  }, [datasetId, excelData]);

  /* -------- Filtering -------- */
  const filteredData = useMemo(() => {
    if (!rows?.length) return [];

    let output = [...rows];

    Object.entries(filters || {}).forEach(([field, rule]) => {
      if (!rule?.value) return;

      output = output.filter(r =>
        String(getValue(r, field))
          .toLowerCase()
          .includes(String(rule.value).toLowerCase())
      );
    });

    if (selectedFields?.length) {
      output = output.map(r => {
        const obj = {};
        selectedFields.forEach(f => {
          obj[f] = getValue(r, f);
        });
        return obj;
      });
    }

    return output;
  }, [rows, filters, selectedFields]);

  /* -------- Chart Data -------- */
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    // KPI
    if (type === "kpi") {
      return filteredData.reduce(
        (sum, r) =>
          sum +
          Number(
            getValue(r, yField) ??
              r?.value ??
              r?.y ??
              0
          ),
        0
      );
    }

    // Stacked
    if (type === "stacked_bar") {
      return filteredData.map(r => {
        const obj = {
          x: getValue(r, xField) ?? r?.x,
        };

        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(r).filter(k => k !== xField && k !== "x");

        keys.forEach(k => {
          obj[k] = Number(r[k] ?? 0);
        });

        obj.__row = r;
        return obj;
      });
    }

    // Standard XY charts
    return filteredData.map(r => ({
      x: getValue(r, xField) ?? r?.x,
      y: Number(
        yField
          ? getValue(r, yField)
          : r?.y ?? r?.value ?? 1
      ),
      __row: r,
    }));
  }, [filteredData, type, xField, yField, stackedFields]);

  /* -------- Click Handler -------- */
  const handlePointClick = payload => {
    if (!onPointClick) return;

    const originalRow = payload?.__row || payload;

    onPointClick({
      row: deepFlatten(originalRow),
    });
  };

  /* -------- Render -------- */
  if (loading) return <div>Loading dataset…</div>;

  if (!rows.length) return <div>No data returned</div>;

  if (!filteredData.length) return <div>No matching data</div>;

  const wrapperClass = fullscreen
    ? "fixed inset-0 bg-white z-50 p-6 overflow-auto"
    : "";

  return (
    <div className={wrapperClass}>
      {type === "line" && (
        <LineChart data={chartData} onPointClick={handlePointClick} />
      )}

      {type === "bar" && (
        <BarChart data={chartData} onBarClick={handlePointClick} />
      )}

      {type === "pie" && (
        <PieChart data={chartData} onSliceClick={handlePointClick} />
      )}

      {type === "area" && (
        <AreaChart data={chartData} onPointClick={handlePointClick} />
      )}

      {type === "scatter" && (
        <ScatterChart data={chartData} onPointClick={handlePointClick} />
      )}

      {type === "stacked_bar" && (
        <StackedBarChart
          data={chartData}
          xKey="x"
          yKeys={stackedFields}
          onBarClick={handlePointClick}
        />
      )}

      {type === "kpi" && (
        <KPI value={chartData} label={yField || "Value"} />
      )}
    </div>
  );
}
