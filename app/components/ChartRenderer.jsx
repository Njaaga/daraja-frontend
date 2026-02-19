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
  onPointClick,
  fullscreen = false,
}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===================== LOAD DATA (LIVE) ===================== */
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);

      try {
        /* Excel charts are static */
        if (!datasetId) {
          if (!cancelled) setRawData(excelData || []);
          return;
        }

        /* Dataset-backed charts (QuickBooks) */
        const res = await apiClient(
          `/api/datasets/${datasetId}/run/`,
          {
            method: "POST",
            body: JSON.stringify({
              filters,
              selected_fields: selectedFields,
            }),
          }
        );

        const rows =
          Array.isArray(res) ? res :
          res?.data || res?.results || [];

        if (!cancelled) setRawData(rows);
      } catch {
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    datasetId,
    excelData,
    JSON.stringify(filters),
    JSON.stringify(selectedFields),
  ]);

  /* ===================== APPLY LOGIC & FILTERS ===================== */
  const filteredData = useMemo(() => {
    let output = [...rawData];

    if (logicRules.length) {
      output = applyLogic(output, logicRules);
    }

    Object.entries(filters).forEach(([field, rule]) => {
      if (!rule || rule.value === "" || rule.value == null) return;

      const value = rule.value;

      if (rule.type === "text") {
        output = output.filter(row =>
          String(getValueByPath(row, field) ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase())
        );
      }

      if (rule.type === "min") {
        output = output.filter(row =>
          Number(getValueByPath(row, field)) >= Number(value)
        );
      }

      if (rule.type === "max") {
        output = output.filter(row =>
          Number(getValueByPath(row, field)) <= Number(value)
        );
      }
    });

    if (selectedFields?.length) {
      output = output.map(row => {
        const pruned = {};
        selectedFields.forEach(f => {
          pruned[f] = getValueByPath(row, f);
        });
        return pruned;
      });
    }

    return output;
  }, [rawData, filters, logicRules, selectedFields]);

  /* ===================== PREPARE CHART DATA ===================== */
  const chartData = useMemo(() => {
    if (type === "kpi") {
      return filteredData.reduce(
        (sum, row) => sum + Number(row[yField] || 0),
        0
      );
    }

    if (type === "stacked_bar") {
      return filteredData.map(row => {
        const obj = { x: row[xField] };
        const keys = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => k !== xField);

        keys.forEach(k => {
          obj[k] = Number(row[k] || 0);
        });

        obj.__row = row;
        return obj;
      });
    }

    if (xField && yField) {
      return filteredData.map(row => ({
        x: row[xField],
        y: Number(row[yField] || 0),
        __row: row,
      }));
    }

    return filteredData;
  }, [filteredData, type, xField, yField, stackedFields]);

  /* ===================== CLICK HANDLER ===================== */
  const handlePointClick = (payload) => {
    if (!onPointClick || !payload) return;

    const original = payload.__row || payload;
    const flattened = deepFlatten(original);

    onPointClick({ row: flattened });
  };

  /* ===================== RENDER ===================== */
  if (loading) return <div>Loading data…</div>;
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
