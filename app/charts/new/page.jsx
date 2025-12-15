"use client";

import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/app/components/Layout";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";

const ResponsiveGridLayout = WidthProvider(Responsive);

/* ---------- UTILITIES ---------- */

// Flatten nested objects for table rendering
const flattenObjectDeep = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + "." : "";
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObjectDeep(obj[k], pre + k));
    } else if (Array.isArray(obj[k])) {
      acc[pre + k] = obj[k].map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ");
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});

// Render cell values for table
const renderCell = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return value.toString();
};

/* ---------- TABLE RENDERER ---------- */
const TableRenderer = ({ dataset }) => {
  if (!dataset || !dataset.length) return <p>No data</p>;

  const flatDataset = dataset.map(flattenObjectDeep);
  const cols = Array.from(new Set(flatDataset.flatMap((r) => Object.keys(r))));

  return (
    <div className="overflow-auto max-h-80 border rounded">
      <table className="w-full table-auto border-collapse text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {cols.map((c) => (
              <th key={c} className="p-2 border-b text-left">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flatDataset.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {cols.map((c) => (
                <td key={c} className="p-2 border-b">{renderCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- LOGIC GATE / RULE EVALUATION ---------- */
const applyRules = (dataset, rules) => {
  if (!rules.length) return dataset;

  return dataset.filter((row) => {
    return rules.every((rule) => {
      const val = row[rule.field];
      switch (rule.operator) {
        case "equals":
          return val === rule.value;
        case "contains":
          return val?.toString().includes(rule.value);
        case "greater":
          return Number(val) > Number(rule.value);
        case "less":
          return Number(val) < Number(rule.value);
        default:
          return true;
      }
    });
  });
};

/* ---------- DASHBOARD BUILDER ---------- */
export default function DashboardBuilder() {
  const [dataset, setDataset] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  /* ---------- Fetch Free API Data ---------- */
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await res.json();
        setDataset(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  /* ---------- Apply Rules Whenever Dataset or Rules Change ---------- */
  useEffect(() => {
    setFilteredData(applyRules(dataset, rules));
  }, [dataset, rules]);

  /* ---------- Wizard / Rule Handlers ---------- */
  const addRule = () => setRules([...rules, { field: "", operator: "equals", value: "" }]);
  const updateRule = (index, key, value) => {
    const newRules = [...rules];
    newRules[index][key] = value;
    setRules(newRules);
  };
  const removeRule = (index) => setRules(rules.filter((_, i) => i !== index));

  /* ---------- Export to Excel ---------- */
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DashboardData");
    XLSX.writeFile(wb, "dashboard.xlsx");
  };

  /* ---------- Grid Layout Example ---------- */
  const layout = [
    { i: "table", x: 0, y: 0, w: 6, h: 8 },
    { i: "chart", x: 6, y: 0, w: 6, h: 8 },
  ];

  return (
    <Layout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Dashboard Builder</h1>

        {/* ---------- Date Filter ---------- */}
        <div>
          <label className="mr-2">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="border p-1 rounded"
          />
        </div>

        {/* ---------- Rules Wizard ---------- */}
        <div className="border p-2 rounded space-y-2">
          <h2 className="font-semibold">Rules / Logic Gates</h2>
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="Field"
                value={rule.field}
                onChange={(e) => updateRule(i, "field", e.target.value)}
                className="border p-1 rounded"
              />
              <select
                value={rule.operator}
                onChange={(e) => updateRule(i, "operator", e.target.value)}
                className="border p-1 rounded"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater">Greater</option>
                <option value="less">Less</option>
              </select>
              <input
                placeholder="Value"
                value={rule.value}
                onChange={(e) => updateRule(i, "value", e.target.value)}
                className="border p-1 rounded"
              />
              <button onClick={() => removeRule(i)} className="bg-red-500 text-white p-1 rounded">Delete</button>
            </div>
          ))}
          <button onClick={addRule} className="bg-blue-500 text-white p-1 rounded mt-2">Add Rule</button>
        </div>

        {/* ---------- Grid Layout ---------- */}
        <ResponsiveGridLayout
          className="layout border"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200 }}
          cols={{ lg: 12 }}
          rowHeight={30}
          width={1200}
        >
          {/* Table */}
          <div key="table" className="bg-white border p-2 rounded">
            <h3 className="font-semibold mb-2">Data Preview</h3>
            <TableRenderer dataset={filteredData} />
          </div>

          {/* Chart */}
          <div key="chart" className="bg-white border p-2 rounded">
            <h3 className="font-semibold mb-2">Chart Preview</h3>
            <ChartRenderer dataset={filteredData} xField="id" yField="userId" chartType="bar" />
          </div>
        </ResponsiveGridLayout>

        {/* Export Button */}
        <button onClick={exportExcel} className="bg-green-500 text-white p-2 rounded mt-2">Export to Excel</button>
      </div>
    </Layout>
  );
}
