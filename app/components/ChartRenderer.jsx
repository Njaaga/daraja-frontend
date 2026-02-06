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

/* ===================== HELPERS ===================== */

function evaluateRule(row, rule) {
  const { field, operator, value } = rule;
  const rowValue = row[field];

  switch (operator) {
    case "=": return String(rowValue) === String(value);
    case "!=": return String(rowValue) !== String(value);
    case ">": return Number(rowValue) > Number(value);
    case "<": return Number(rowValue) < Number(value);
    case ">=": return Number(rowValue) >= Number(value);
    case "<=": return Number(rowValue) <= Number(value);
    case "contains": return String(rowValue).includes(String(value));
    default: return true;
  }
}

function applyLogic(data, rules) {
  if (!rules?.length) return data;
  return data.filter(row => rules.every(rule => evaluateRule(row, rule)));
}

function getValueByPath(obj, path) {
  return path?.split(".").reduce((acc, key) => acc?.[key], obj);
}

/* ===================== CHART RENDERER ===================== */

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

  /* 🔥 NEW */
  onPointClick,
  fullscreen = false,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Load Data ---------- */
  useEffect(() => {
    if (!datasetId) {
      setData(excelData || []);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await apiClient(`/api/datasets/${datasetId}/run/`, { method: "POST" });
        setData(Array.isArray(res) ? res : res?.data || res?.results || []);
      } catch {
        setData([]);
      }
      setLoading(false);
    };

    load();
  }, [datasetId, excelData]);

  /* ---------- Apply Logic + Filters ---------- */
  const filteredData = useMemo(() => {
    let output = [...data];

    if (logicRules.length) output = applyLogic(output, logicRules);

    Object.entries(filters).forEach(([field, rule]) => {
      if (!rule) return;
      const val = rule.value;

      if (rule.type === "text" && val) {
        output = output.filter(r =>
          String(getValueByPath(r, field)).toLowerCase().includes(String(val).toLowerCase())
        );
      }

      if (rule.type === "min" && val !== "") {
        output = output.filter(r => Number(getValueByPath(r, field)) >= Number(val));
      }

      if (rule.type === "max" && val !== "") {
        output = output.filter(r => Number(getValueByPath(r, field)) <= Number(val));
      }
    });

    if (selectedFields?.length) {
      output = output.map(row => {
        const pruned = {};
        selectedFields.forEach(f => pruned[f] = getValueByPath(row, f));
        return pruned;
      });
    }

    return output;
  }, [data, filters, logicRules, selectedFields]);

  /* ---------- Chart Mapping ---------- */
  const chartData = useMemo(() => {
    if (type === "kpi") {
      return filteredData.reduce((sum, r) => sum + Number(r[yField] || 0), 0);
    }

    if (type === "stacked_bar") {
      return filteredData.map(row => {
        const obj = { x: row[xField] };
        const fields = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => k !== xField);
        fields.forEach(f => obj[f] = Number(row[f] || 0));
        return obj;
      });
    }

    if (xField && yField) {
      return filteredData.map(row => ({
        x: row[xField],
        y: Number(row[yField] || 0),
        __row: row, // 🔥 keep original row for drilldown
      }));
    }

    return filteredData;
  }, [filteredData, type, xField, yField, stackedFields]);

  /* ---------- Click Handler ---------- */
  const handlePointClick = (payload) => {
    if (!onPointClick || !payload) return;

    onPointClick({
      field: xField,
      value: payload.x,
      row: payload.__row || payload,
    });
  };

  /* ---------- Render ---------- */
  if (loading) return <div>Loading dataset…</div>;
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

      {type === "stacked_bar" && (
        <StackedBarChart
          data={chartData}
          xKey={xField}
          yKeys={stackedFields}
          onBarClick={handlePointClick}
        />
      )}

      {type === "area" && (
        <AreaChart data={chartData} onPointClick={handlePointClick} />
      )}

      {type === "scatter" && (
        <ScatterChart data={chartData} onPointClick={handlePointClick} />
      )}

      {type === "kpi" && (
        <KPI value={chartData} label={yField} />
      )}
    </div>
  );
}
