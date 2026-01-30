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

// ---------------------
// Helpers
// ---------------------

// Evaluate logic rule for a single row
function evaluateRule(row, rule) {
  const { field, operator, value } = rule;
  if (!(field in row)) return true;
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
  if (!rules || rules.length === 0) return data;
  return data.filter(row => rules.every(rule => evaluateRule(row, rule)));
}

// Resolve nested paths like "address.street" safely
function getValueByPath(obj, path) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

// ---------------------
// Main ChartRenderer
// ---------------------
export default function ChartRenderer({
  datasetId,
  type,
  xField,
  yField,
  stackedFields = [],
  filters = {},
  excelData = null,
  logicRules = [],
  selectedFields = null, // array of field paths
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Load base data ---
  useEffect(() => {
    if (!datasetId) {
      setData(excelData || []);
      setLoading(false);
      return;
    }

    const fetchDataset = async () => {
      try {
        const res = await apiClient(`/api/datasets/${datasetId}/run/`, { method: "POST" });
        const normalized = Array.isArray(res) ? res : res?.data || res?.results || [];
        setData(normalized);
      } catch (err) {
        console.error("Error loading dataset", err);
        setData([]);
      }
      setLoading(false);
    };

    fetchDataset();
  }, [datasetId, excelData]);

  // --- Apply filters, logic, and prune fields ---
  const filteredData = useMemo(() => {
    if (!data || !data.length) return [];

    let output = [...data];

    // Apply logic rules
    if (logicRules?.length) output = applyLogic(output, logicRules);

    // Apply filters
    Object.entries(filters).forEach(([field, rule]) => {
      if (!rule || !output.some(r => field in r)) return;

      if (rule.type === "text" && rule.value) {
        output = output.filter(r =>
          String(getValueByPath(r, field)).toLowerCase().includes(String(rule.value).toLowerCase())
        );
      }
      if (rule.type === "min" && rule.value !== "") {
        output = output.filter(r => Number(getValueByPath(r, field)) >= Number(rule.value));
      }
      if (rule.type === "max" && rule.value !== "") {
        output = output.filter(r => Number(getValueByPath(r, field)) <= Number(rule.value));
      }
      if (rule.type === "date_range" && rule.start && rule.end) {
        output = output.filter(r => {
          const d = new Date(getValueByPath(r, field));
          return d >= new Date(rule.start) && d <= new Date(rule.end);
        });
      }
    });

    // Only keep selected fields
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
  }, [data, filters, logicRules, selectedFields]);

  // --- Table pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // --- Map chart data ---
  const chartData = useMemo(() => {
    if (type === "kpi") return filteredData.reduce((acc, row) => acc + Number(row[yField] || 0), 0);

    if (type === "stacked_bar") {
      return filteredData.map(row => {
        const obj = { x: row[xField] };
        const fieldsToUse = stackedFields.length
          ? stackedFields
          : Object.keys(row).filter(k => k !== xField);
        fieldsToUse.forEach(f => obj[f] = Number(row[f] || 0));
        return obj;
      });
    }

    if (xField && yField) {
      return filteredData.map(row => ({ x: row[xField], y: Number(row[yField] || 0) }));
    }

    return filteredData;
  }, [filteredData, type, xField, yField, stackedFields]);

  // --- Render ---
  if (loading) return <div>Loading dataset...</div>;
  if (!filteredData.length) return <div>No matching data</div>;

  switch (type) {
    case "line": return <LineChart data={chartData} />;
    case "bar": return <BarChart data={chartData} />;
    case "stacked_bar": {
      const finalStackedFields = stackedFields.length
        ? stackedFields
        : filteredData.length
          ? Object.keys(filteredData[0]).filter(k => k !== xField)
          : [];
      return <StackedBarChart data={chartData} xKey={xField} yKeys={finalStackedFields} />;
    }
    case "pie": return <PieChart data={chartData} xKey={xField} yKey={yField} />;
    case "kpi": return <KPI value={chartData} label={yField} />;
    case "scatter": return <ScatterChart data={chartData} xKey={xField} yKey={yField} />;
    case "area": return <AreaChart data={chartData} xKey={xField} yKey={yField} />;
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead>
              <tr>
                {selectedFields.map(f => (
                  <th key={f} className="border p-2">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i}>
                  {selectedFields.map((f, j) => (
                    <td key={j} className="border p-2">{String(row[f] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-2 flex-wrap">
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span>
                Page{" "}
                <input
                  type="number"
                  className="border rounded w-12 text-center"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                  }}
                />{" "}
                of {totalPages}
              </span>
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <select
                className="border rounded px-2 py-1"
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50, 100].map(r => (
                  <option key={r} value={r}>{r} rows</option>
                ))}
              </select>
            </div>
          )}
        </div>
      );

    default:
      return <div>Unknown chart type 🤔</div>;
  }
}
