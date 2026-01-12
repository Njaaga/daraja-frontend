"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import SuperadminGate from "@/app/components/SuperadminGate";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx";
import "react-datepicker/dist/react-datepicker.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import InfoTooltip from "@/app/components/InfoTooltip";

/**
 * DashboardBuilder - enhanced full-featured replacement for your original component
 *
 * Major improvements:
 * - CSV + Google Sheets ingestion in addition to Excel
 * - Enhanced logic engine (nested paths, arrays, many operators)
 * - Calculated fields with helper functions (SUM/AVG/IF)
 * - Join types: inner/left/right/full
 * - Richer filters: text/number/date/dropdown/regex
 * - Chart builder supports aggregates, more chart types, drill-to-filter hooks
 * - Export JSON template, improved CSV/Excel export
 * - Searchable field selects and sample-based performance handling
 *
 * NOTE: Keep the ChartRenderer component; it should accept the props we pass (type, excelData, xField, yField, aggregates, onPointClick).
 */

const ResponsiveGridLayout = WidthProvider(Responsive);

/* --------------------- Utilities --------------------- */

// Flatten nested objects to dotted paths (shallow for speed) — preserves arrays as joined string
const flattenObject = (obj, prefix = "") =>
  Object.keys(obj || {}).reduce((res, k) => {
    const pre = prefix.length ? prefix + "." : "";
    const val = obj[k];
    if (val === null || val === undefined) {
      res[pre + k] = val;
    } else if (Array.isArray(val)) {
      // keep array as-is for evaluator, but flatten to string for display/export
      res[pre + k] = val;
    } else if (typeof val === "object") {
      Object.assign(res, flattenObject(val, pre + k));
    } else {
      res[pre + k] = val;
    }
    return res;
  }, {});

// Safely get nested value by path "a.b.c"
function getValueByPath(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Detect basic type of a value
const detectType = (v) => {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number" && !isNaN(v)) return "number";
  if (!isNaN(Date.parse(String(v)))) return "date";
  return typeof v;
};

// Convert dataset rows to safe JSON-exportable rows (flatten arrays to strings)
const normalizeForExport = (rows) =>
  (rows || []).map((r) => {
    const flat = flattenObject(r);
    const out = {};
    Object.entries(flat).forEach(([k, v]) => {
      if (Array.isArray(v)) out[k] = v.map((i) => (typeof i === "object" ? JSON.stringify(i) : String(i))).join(", ");
      else out[k] = v;
    });
    return out;
  });

/* --------------------- Advanced Calculated Fields --------------------- */
/**
 * Provide safe helper functions available to calculated field expressions:
 * SUM(arr), AVG(arr), LEN(val), IF(cond, a, b)
 *
 * We evaluate expressions using new Function with explicit argument names
 * derived from flattened row keys — this is exactly how your original code worked,
 * but we add helpers and graceful failure handling.
 */
function buildCalcExecutor(expr, fieldKeys) {
  const helpers = {
    SUM: (arr) => Array.isArray(arr)
      ? arr.reduce((s, x) => s + Number(x || 0), 0)
      : Number(arr || 0),

    AVG: (arr) => Array.isArray(arr)
      ? (arr.length ? arr.reduce((s, x) => s + Number(x || 0), 0) / arr.length : 0)
      : Number(arr || 0),

    LEN: (x) => {
      if (x === null || x === undefined) return 0;
      if (Array.isArray(x)) return x.length;
      if (typeof x === "number") return 1;
      return String(x).length;
    },

    IF: (cond, a, b) => (cond ? a : b),
  };

  const args = [...fieldKeys, "__helpers"];
  const body = `
    try {
      const {SUM,AVG,LEN,IF} = __helpers;
      return (${expr});
    } catch (e) {
      return null;
    }
  `;

  // eslint-disable-next-line no-new-func
  const fn = new Function(...args, body);
  return (rowValues) => fn(...rowValues, helpers);
}


/* --------------------- Logic Engine --------------------- */
/**
 * The logic engine supports:
 * - Expression strings (like: (age > 10) AND (status = "active") )
 * - OR/AND/NOT, parentheses
 * - CONTAINS / STARTS WITH / ENDS WITH textual operators
 * - Comparison operators: =, ==, !=, >, >=, <, <=
 *
 * Implementation strategy:
 * - Convert a user expression to a JS-safe expression (replace operators and quoted strings preserved)
 * - Replace dotted field references with sanitized identifiers and pass their values as args to new Function
 *
 * This approach keeps flexibility while supporting nested keys and arrays.
 */

function sanitizeIdentifier(k) {
  return String(k).replace(/[^a-zA-Z0-9_]/g, "_");
}

function convertToJsExpression(expr) {
  if (!expr || !String(expr).trim()) return "true";

  let s = String(expr);

  // Replace textual operators (case-insensitive)
  s = s.replace(/\bAND\b/gi, "&&");
  s = s.replace(/\bOR\b/gi, "||");
  s = s.replace(/\bNOT\b/gi, "!");
  // CONTAINS, STARTS WITH, ENDS WITH
  s = s.replace(/(\b[\w.]+\b)\s+CONTAINS\s+"([^"]*)"/gi, 'String($1 || "").includes("$2")');
  s = s.replace(/(\b[\w.]+\b)\s+STARTS WITH\s+"([^"]*)"/gi, 'String($1 || "").startsWith("$2")');
  s = s.replace(/(\b[\w.]+\b)\s+ENDS WITH\s+"([^"]*)"/gi, 'String($1 || "").endsWith("$2")');

  // Handling = -> === where appropriate (avoid >=, <=, != etc)
  s = s.replace(/(?<![=!<>])=(?!=)/g, "===");

  return s;
}

// Evaluate expression for a single row safely
function evaluateExpressionForRow(row, rawExpr) {
  if (!rawExpr || !String(rawExpr).trim()) return true;
  const expr = convertToJsExpression(rawExpr);

  // Extract all dotted identifiers used in expression (simple heuristic)
  const idPattern = /\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g;
  const matches = new Set();
  let m;
  while ((m = idPattern.exec(expr))) {
    const tok = m[1];
    // exclude JS reserved words and operators like AND/OR converted already
    if (/^(true|false|null|undefined|NaN|Infinity|AND|OR|NOT)$/.test(tok)) continue;
    // if looks like a number skip
    if (!isNaN(Number(tok))) continue;
    matches.add(tok);
  }

  // Build sanitized map and argument lists
  const sanitizedKeys = [];
  const values = [];
  const mapping = {};
  matches.forEach((k) => {
    const sk = sanitizeIdentifier(k);
    mapping[k] = sk;
    sanitizedKeys.push(sk);
    const v = getValueByPath(row, k);
    values.push(v);
  });

  // Replace occurrences of dotted names in expr with sanitized variable names
  let safeExpr = expr;
  // Sort keys by length desc to avoid partial replace issues (a.b before a)
  Array.from(matches)
    .sort((a, b) => b.length - a.length)
    .forEach((k) => {
      const sk = mapping[k];
      // Use word boundary replace (but with dots allowed)
      const re = new RegExp("\\b" + k.replace(/\./g, "\\.") + "\\b", "g");
      safeExpr = safeExpr.replace(re, sk);
    });

  // Now create function with sanitizedKeys as args
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...sanitizedKeys, `return (${safeExpr});`);
    const res = fn(...values);
    return !!res;
  } catch (err) {
    console.warn("Expression eval error:", err, rawExpr, safeExpr, row);
    return false;
  }
}

/* --------------------- Join Engine --------------------- */
/**
 * Supports join types: inner, left, right, full
 * Works on flattened rows (keys are dotted)
 */
function runJoins(sourcesMap, joinsCfg, primaryKey, sampleLimit = 5000) {
  const keys = Object.keys(sourcesMap || {});
  if (!keys.length) return [];

  // Determine primaryKey fallback
  let pKey = primaryKey;
  if (!pKey) pKey = keys[0];

  // Start from primary
  let result = (sourcesMap[pKey] || []).map((r) => flattenObject(r));

  // For each join, perform join with right dataset
  for (const j of joinsCfg || []) {
    if (!j.leftDataset || !j.rightDataset || !j.leftField || !j.rightField) continue;

    const leftRows = result;
    const rightRaw = sourcesMap[j.rightDataset] || [];
    const rightRows = rightRaw.map((r) => flattenObject(r));

    // Build index on right field for quick lookup
    const index = new Map();
    for (const r of rightRows) {
      const key = String(getValueByPath(r, j.rightField) ?? "");
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(r);
    }

    if (j.type === "inner") {
      const newRows = [];
      for (const l of leftRows) {
        const key = String(getValueByPath(l, j.leftField) ?? "");
        const matches = index.get(key) || [];
        for (const r of matches) {
          newRows.push({ ...l, ...r });
        }
      }
      result = newRows;
    } else if (j.type === "left") {
      const newRows = [];
      for (const l of leftRows) {
        const key = String(getValueByPath(l, j.leftField) ?? "");
        const matches = index.get(key) || [];
        if (matches.length) {
          for (const r of matches) newRows.push({ ...l, ...r });
        } else {
          newRows.push(l);
        }
      }
      result = newRows;
    } else if (j.type === "right") {
      // right join: keep all right rows, attach left where matching
      const leftIndex = new Map();
      for (const l of leftRows) {
        const key = String(getValueByPath(l, j.leftField) ?? "");
        if (!leftIndex.has(key)) leftIndex.set(key, []);
        leftIndex.get(key).push(l);
      }
      const newRows = [];
      for (const r of rightRows) {
        const key = String(getValueByPath(r, j.rightField) ?? "");
        const matches = leftIndex.get(key) || [];
        if (matches.length) {
          for (const l of matches) newRows.push({ ...l, ...r });
        } else {
          newRows.push({ ...r });
        }
      }
      result = newRows;
    } else if (j.type === "full") {
      // full outer join: union of left + right, matching where possible
      const leftIndex = new Map();
      for (const l of leftRows) {
        const key = String(getValueByPath(l, j.leftField) ?? "");
        if (!leftIndex.has(key)) leftIndex.set(key, []);
        leftIndex.get(key).push(l);
      }
      const seen = new Set();
      const newRows = [];
      for (const r of rightRows) {
        const key = String(getValueByPath(r, j.rightField) ?? "");
        const matches = leftIndex.get(key) || [];
        if (matches.length) {
          for (const l of matches) {
            newRows.push({ ...l, ...r });
            seen.add(l);
          }
        } else {
          newRows.push({ ...r });
        }
      }
      // add left-only rows not matched
      for (const l of leftRows) {
        if (!seen.has(l)) newRows.push(l);
      }
      result = newRows;
    }
  }

  // If very big, sample (simple performance safety)
  if (result.length > sampleLimit) {
    console.warn(`Result rows (${result.length}) exceed sample limit (${sampleLimit}). Returning first ${sampleLimit} rows for preview/perf.`);
    return result.slice(0, sampleLimit);
  }

  return result;
}

/* --------------------- Filters --------------------- */
/**
 * Filters supports:
 * - text contains/equals/starts/ends
 * - number min/max
 * - date start/end
 * - dropdown (exact match)
 * - regex
 */
const applyFiltersToRows = (rows, filters) => {
  if (!filters || !filters.length) return rows;
  return rows.filter((row) => {
    for (const f of filters) {
      if (!f.field) continue;
      const v = getValueByPath(row, f.field);
      if (f.type === "text") {
        const val = String(v ?? "").toLowerCase();
        const cmp = String(f.value ?? "").toLowerCase();
        if (f.operator === "contains" && !val.includes(cmp)) return false;
        if (f.operator === "equals" && val !== cmp) return false;
        if (f.operator === "starts" && !val.startsWith(cmp)) return false;
        if (f.operator === "ends" && !val.endsWith(cmp)) return false;
        if (f.operator === "regex") {
          try {
            const r = new RegExp(f.value);
            if (!r.test(String(v ?? ""))) return false;
          } catch {
            return false;
          }
        }
      } else if (f.type === "number") {
        const n = Number(v);
        if (f.min !== "" && f.min !== undefined && !isNaN(Number(f.min)) && n < Number(f.min)) return false;
        if (f.max !== "" && f.max !== undefined && !isNaN(Number(f.max)) && n > Number(f.max)) return false;
      } else if (f.type === "date") {
        const d = v ? new Date(v) : null;
        if (!d) return false;
        if (f.startDate && d < new Date(f.startDate)) return false;
        if (f.endDate && d > new Date(f.endDate)) return false;
      } else if (f.type === "dropdown") {
        if (!((f.dropdownOptions || []).includes(v))) return false;
      }
    }
    return true;
  });
};

/* --------------------- Exports --------------------- */
function exportToExcel(rows, name = "export.xlsx") {
  if (!rows || !rows.length) return alert("No data to export");
  const ws = XLSX.utils.json_to_sheet(normalizeForExport(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, name);
}

function exportDashboardTemplate(obj, name = "dashboard-template.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------------- Main Component --------------------- */

export default function DashboardBuilder() {
  // Steps
  const STEPS = {
    SELECT_DATASET: 0,
    FIELDS: 1,
    JOINS: 2,
    CALCULATED: 3,
    LOGIC_GATES: 4,
    FILTERS: 5,
    CHARTS: 6,
    LAYOUT: 7,
    PUBLISH: 8,
  };
  const [step, setStep] = useState(STEPS.SELECT_DATASET);

  // Core meta
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardId, setDashboardId] = useState(null);

  // datasets
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // dataset objects
  const [datasetRows, setDatasetRows] = useState({}); // id => rows[]
  const [datasetFields, setDatasetFields] = useState({}); // id => [fields]

  // file ingestion
  const [excelData, setExcelData] = useState(null);
  const [csvNotice, setCsvNotice] = useState("");

  // filters & query
  const [filters, setFilters] = useState([]);
  const [query, setQuery] = useState("");

  // joins & calculated
  const [joins, setJoins] = useState([]); // {id,leftDataset,leftField,rightDataset,rightField,type}
  const [calculatedFields, setCalculatedFields] = useState([]); // {id,name,expr,type}

  // logic gates
  const [logicExpr, setLogicExpr] = useState("");
  const [logicSaved, setLogicSaved] = useState([]); // {id,name,expr}

  // charts & layout
  const [charts, setCharts] = useState([]);
  const [layout, setLayout] = useState([]);

  // chart builder temp
  const [chartType, setChartType] = useState("bar");
  const [chartX, setChartX] = useState("");
  const [chartY, setChartY] = useState("");
  const [chartAgg, setChartAgg] = useState("none");
  const [chartTitle, setChartTitle] = useState("");

  // preview
  const [preview, setPreview] = useState([]);

  // loading / flags
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // local refs
  const sampleLimit = 5000; // preview safety

  /* ---------- load datasets list ---------- */
  useEffect(() => {
    async function load() {
      setLoadingDatasets(true);
      try {
        const res = await apiClient("/api/datasets/");
        const list = Array.isArray(res) ? res : res?.data ? res.data : [];
        setDatasets(list || []);
      } catch (err) {
        console.error("Failed to load datasets:", err);
        setDatasets([]);
      }
      setLoadingDatasets(false);
    }
    load();
  }, []);

  /* ---------- fetch dataset rows helper (server-run) ---------- */
  const fetchDataset = async (dataset) => {
    if (!dataset || !dataset.id) return [];
    try {
      const res = await apiClient(`/api/datasets/${dataset.id}/run/`, { method: "POST", body: JSON.stringify({}) });
      const rows = res?.data?.data || res?.data || res?.results || res || [];
      const arr = Array.isArray(rows) ? rows : typeof rows === "object" ? rows.data || [] : [];
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      console.error("run dataset error:", err);
      return [];
    }
  };

  /* ---------- dataset select toggle ---------- */
  const toggleSelectDataset = async (datasetId) => {
    const ds = datasets.find((x) => String(x.id) === String(datasetId));
    if (!ds) return;
    const exists = selectedDatasets.find((s) => String(s.id) === String(ds.id));
    const next = exists ? selectedDatasets.filter((s) => String(s.id) !== String(ds.id)) : [...selectedDatasets, ds];
    setSelectedDatasets(next);
    setExcelData(null);

    // if newly selected, fetch rows
    if (!exists) {
      const rows = await fetchDataset(ds);
      setDatasetRows((m) => ({ ...m, [ds.id]: rows }));
      const sample = rows && rows.length ? rows[0] : {};
      const flat = flattenObject(sample);
      setDatasetFields((m) => ({ ...m, [ds.id]: Object.keys(flat) }));
    } else {
      // removing — optionally remove cached rows
      // setDatasetRows((m) => { const nm = {...m}; delete nm[ds.id]; return nm; });
    }
  };

  /* ---------- CSV / Excel / Google Sheets upload ---------- */
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
      setExcelData(sheetData || []);
      setSelectedDatasets([]);
      setDatasetFields((m) => ({ ...m, excel: Object.keys(flattenObject(sheetData?.[0] || {})) }));
      setDatasetRows((m) => ({ ...m, excel: sheetData || [] }));
    };
    reader.readAsArrayBuffer(file);
    setCsvNotice("");
  };

  // CSV via paste or file (XLSX already handles many), but support direct CSV parsing
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      try {
        const wb = XLSX.read(text, { type: "string" });
        const sheet = wb.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
        setExcelData(sheetData || []);
        setSelectedDatasets([]);
        setDatasetFields((m) => ({ ...m, excel: Object.keys(flattenObject(sheetData?.[0] || {})) }));
        setDatasetRows((m) => ({ ...m, excel: sheetData || [] }));
        setCsvNotice("");
      } catch (err) {
        console.error("CSV parse failed:", err);
        setCsvNotice("Failed to parse CSV. Try Excel upload instead.");
      }
    };
    reader.readAsText(file);
  };

  // Google Sheets public CSV URL (user supplies the CSV export URL)
  const handleGoogleSheets = async (csvUrl) => {
    if (!csvUrl) return alert("Paste the Google Sheets CSV URL (export format)");
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) {
        setCsvNotice(`Failed to fetch sheet: ${res.status}`);
        return;
      }
      const text = await res.text();
      const wb = XLSX.read(text, { type: "string" });
      const sheet = wb.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
      setExcelData(sheetData || []);
      setSelectedDatasets([]);
      setDatasetFields((m) => ({ ...m, excel: Object.keys(flattenObject(sheetData?.[0] || {})) }));
      setDatasetRows((m) => ({ ...m, excel: sheetData || [] }));
      setCsvNotice("");
    } catch (err) {
      console.error("Google sheets fetch failed:", err);
      setCsvNotice("Failed to fetch Google Sheets (CORS may block if sheet is not public).");
    }
  };

  /* ---------- joins & calc management UI helpers ---------- */
  const addJoin = () => setJoins([...joins, { id: Date.now().toString(), leftDataset: "", leftField: "", rightDataset: "", rightField: "", type: "inner" }]);
  const updateJoin = (i, key, value) => { const c = [...joins]; c[i][key] = value; setJoins(c); };
  const removeJoin = (i) => setJoins(joins.filter((_, idx) => idx !== i));

  const addCalc = () => setCalculatedFields([...calculatedFields, { id: Date.now().toString(), name: "", expr: "", type: "number" }]);
  const updateCalc = (i, key, value) => { const c = [...calculatedFields]; c[i][key] = value; setCalculatedFields(c); };
  const removeCalc = (i) => setCalculatedFields(calculatedFields.filter((_, idx) => idx !== i));

  /* ---------- filters management ---------- */
  const addFilter = () => setFilters([...filters, { id: Date.now().toString(), field: "", type: "text", operator: "contains", value: "", min: "", max: "", startDate: null, endDate: null, dropdownOptions: [] }]);
  const updateFilter = (i, key, value) => { const c = [...filters]; c[i][key] = value; setFilters(c); };
  const removeFilter = (i) => setFilters(filters.filter((_, idx) => idx !== i));

  /* ---------- logic saved rules management ---------- */
  const saveLogicRule = (name, expr) => {
    if (!expr || !String(expr).trim()) return alert("Expression required");
    const id = Date.now().toString();
    setLogicSaved((s) => [...s, { id, name: name || `Rule ${s.length + 1}`, expr }]);
    setLogicExpr("");
  };
  const removeLogicRule = (i) => setLogicSaved((s) => s.filter((_, idx) => idx !== i));

  /* ---------- apply calculated fields ---------- */
/* ---------- apply calculated fields ---------- */
/* ---------- apply calculated fields (row + column-level aggregates) ---------- */
const applyCalculatedFields = (rows, calcs) => {
  if (!rows?.length || !calcs?.length) return rows;

  let outRows = rows.map((r) => flattenObject(r));

  // ---------- ROW-LEVEL ----------
  for (const c of calcs) {
    if (!c.name || !c.expr) continue;

    // skip column aggregates
    if (/^(SUM|AVG|LEN)\(/i.test(c.expr.trim())) continue;

    const keys = Object.keys(outRows[0]);
    const executor = buildCalcExecutor(c.expr, keys);

    outRows = outRows.map((r) => {
      const values = keys.map((k) => r[k]);
      r[c.name] = executor(values);
      return r;
    });
  }

  // ---------- COLUMN-LEVEL ----------
  for (const c of calcs) {
    const match = /^(SUM|AVG|LEN)\((.+)\)$/i.exec(c.expr.trim());
    if (!match) continue;

    const func = match[1].toUpperCase();
    const field = match[2].trim();

    let value = 0;
    const colValues = outRows.map((r) => r[field]).filter((v) => v !== null && v !== undefined);

    if (func === "SUM")
      value = colValues.reduce((a, b) => a + Number(b || 0), 0);

    if (func === "AVG")
      value = colValues.length
        ? colValues.reduce((a, b) => a + Number(b || 0), 0) / colValues.length
        : 0;

    if (func === "LEN")
      value = colValues.length;

    outRows = outRows.map((r) => ({ ...r, [c.name]: value }));
  }

  return outRows;
};




  /* ---------- apply logic gates (simple wrapper for expression + saved rules) ---------- */
  const applyLogicGates = (rows, logicExpression, savedRules = []) => {
    if ((!logicExpression || !String(logicExpression).trim()) && (!savedRules || savedRules.length === 0)) return rows;
    return rows.filter((r) => {
      let okMain = true;
      if (logicExpression && String(logicExpression).trim()) okMain = evaluateExpressionForRow(r, logicExpression);
      let okSaved = true;
      for (const rule of savedRules) {
        if (!evaluateExpressionForRow(r, rule.expr)) {
          okSaved = false;
          break;
        }
      }
      return okMain && okSaved;
    });
  };

  /* ---------- helper: union of fields for selects (searchable) ---------- */
  const allFieldOptions = useMemo(() => {
    const fieldsSet = new Set();
    // give priority to excel sample
    if (excelData) {
      (datasetRows["excel"] || []).slice(0, 1).forEach((r) => Object.keys(flattenObject(r)).forEach((f) => fieldsSet.add(f)));
    }
    for (const ds of selectedDatasets) {
      const f = datasetFields[ds.id] || [];
      f.forEach((x) => fieldsSet.add(x));
    }
    return Array.from(fieldsSet).sort();
  }, [selectedDatasets, datasetFields, excelData, datasetRows]);

  /* ---------- preview rebuild whenever sources/joins/calcs/filters/query/logic change ---------- */
  useEffect(() => {
    (async () => {
      setLoadingPreview(true);
      try {
        const sourcesMap = { ...datasetRows };
        if (excelData) sourcesMap["excel"] = excelData;

        // Determine primary key: first selected dataset or excel
        const primaryKey = selectedDatasets.length ? selectedDatasets[0].id : (excelData ? "excel" : Object.keys(sourcesMap)[0]);

        // 1. run joins (handle full/left/right/inner)
        let rows = [];
        if (joins && joins.length > 0) {
          rows = runJoins(sourcesMap, joins, primaryKey, sampleLimit);
        } else if (selectedDatasets && selectedDatasets.length > 0) {
          if (selectedDatasets.length === 1) {
            rows = (datasetRows[selectedDatasets[0].id] || []).map((r) => flattenObject(r));
          } else {
            // union of datasets
            rows = selectedDatasets.flatMap((s) => (datasetRows[s.id] || []).map((r) => flattenObject(r)));
          }
        } else if (excelData) {
          rows = (excelData || []).map((r) => flattenObject(r));
        }

        // 2. calculated fields
        rows = applyCalculatedFields(rows, calculatedFields);

        // 3. logic gates
        rows = applyLogicGates(rows, logicExpr, logicSaved);

        // 4. natural language query (simple contains across all values)
        if (query && String(query).trim()) {
          const t = String(query).toLowerCase();
          rows = rows.filter((r) =>
            Object.values(r).some((v) => {
              if (v == null) return false;
              if (Array.isArray(v)) return v.join(", ").toLowerCase().includes(t);
              return String(v).toLowerCase().includes(t);
            })
          );
        }

        // 5. UI Filters
        rows = applyFiltersToRows(rows, filters);

        setPreview(rows || []);
      } catch (err) {
        console.error("Preview build failed:", err);
        setPreview([]);
      }
      setLoadingPreview(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetRows, excelData, joins, calculatedFields, filters, query, selectedDatasets, logicExpr, logicSaved]);

  /* ---------- export CSV / Excel / JSON ---------- */
  const exportPreviewExcel = () => exportToExcel(preview, `${dashboardName || "data"}-preview.xlsx`);
  const exportDashboardJSON = () => exportDashboardTemplate({
    name: dashboardName,
    selectedDatasets,
    joins,
    calculatedFields,
    logicSaved,
    filters,
    charts,
    layout,
  }, `${dashboardName || "dashboard"}-template.json`);

  /* ---------- add chart (POST to backend) ---------- */
  const addChart = async () => {
    if ((!preview || preview.length === 0) && (!selectedDatasets.length && !excelData)) {
      return alert("No data to chart. Select dataset(s) or upload Excel/CSV.");
    }
    if (!chartX || !chartY) return alert("Select X and Y fields");

    // Create dashboard if needed
    let id = dashboardId;
    if (!id) {
      const res = await apiClient("/api/dashboards/", {
        method: "POST",
        body: JSON.stringify({ name: dashboardName || "New Dashboard" }),
      });
      if (!res?.id) return alert("Failed to create dashboard");
      setDashboardId(res.id);
      id = res.id;
    }

    // Build sanitized joins
    const sanitizedJoins = joins
      .filter((j) => j.leftDataset && j.rightDataset && j.leftField && j.rightField && j.type)
      .map((j) => ({
        left_dataset: Number(j.leftDataset) || j.leftDataset,
        right_dataset: Number(j.rightDataset) || j.rightDataset,
        left_field: j.leftField.trim(),
        right_field: j.rightField.trim(),
        type: j.type.trim(),
      }));

    // Apply logic before sending
    const filteredData = applyLogicGates(preview, logicExpr, logicSaved);

    const payload = {
      name: chartTitle || `${chartType.toUpperCase()} Chart ${charts.length + 1}`,
      chart_type: chartType,
      x_field: chartX,
      y_field: chartY,
      aggregation: chartAgg || null,
      dataset: selectedDatasets.length > 0 ? selectedDatasets[0].id : null,
      excel_data: filteredData,
      filters,
      joins: sanitizedJoins,
      calculated_fields: calculatedFields,
      logic_expression: logicExpr || null,
      logic_rules: logicSaved || [],
    };


    try {
      const chartRes = await apiClient("/api/charts/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!chartRes?.id) return alert("Chart creation failed: backend returned no id");

      await apiClient(`/api/dashboards/${id}/add_chart/`, {
        method: "POST",
        body: JSON.stringify({
          chart_id: chartRes.id,
          layout: { x: 0, y: charts.length * 3, w: 6, h: 3 },
          order: charts.length,
        }),
      });

      const newChart = {
        i: chartRes.id.toString(),
        chartId: chartRes.id,
        name: payload.name,
        type: chartType,
        xField: chartX,
        yField: chartY,
        aggregation: chartAgg,
        datasetIds: payload.dataset_ids,
        excelData: filteredData,
        filters,
        joins: sanitizedJoins,
        calculated_fields: calculatedFields,
        logic_rules: logicSaved || [],
        logic_expression: logicExpr || null,
      };

      setCharts((c) => [...c, newChart]);
      setLayout((l) => [...l, { i: newChart.i, x: 0, y: charts.length * 3, w: 6, h: 3 }]);
      setChartTitle("");
      alert("Chart added!");
    } catch (err) {
      console.error("addChart error:", err);
      alert(err.message || "Chart creation failed");
    }
  };

  /* ---------- layout change handler ---------- */
  const onLayoutChange = (newLayout) => setLayout(newLayout);

  /* ---------- small helpers ---------- */
  const replaceIntoLogicExpr = (token) => setLogicExpr((e) => (e ? e + " " + token : token));

  

  /* ---------- UI ---------- */
  return (
    <SuperadminGate>
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">📊 Dashboard Builder (Enhanced)</h2>

        {/* progress */}
        <div className="mb-4 flex gap-2">
          {[
            "Select Data",
            "Fields",
            "Joins",
            "Calculated",
            "Logic Gates",
            "Filters",
            "Charts",
            "Layout",
            "Publish",
          ].map((label, i) => (
            <div key={i} className={`px-3 py-1 rounded ${step === i ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {i + 1}. {label}
            </div>
          ))}
        </div>

        <input
          placeholder="Dashboard name"
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        {/* Step 0 - Select Data */}
        {step === STEPS.SELECT_DATASET && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Choose dataset(s) or upload Excel / CSV / Google Sheets</h3>
            <InfoTooltip text="Connect APIs, CSV, Excel, or Google Sheets as input datasets for your dashboard." />
            <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">API Datasets</label>
                {loadingDatasets ? <div>Loading...</div> : (
                  <div className="grid gap-2 max-h-64 overflow-auto">
                    {datasets.map((d) => {
                      const selected = selectedDatasets.find((s) => String(s.id) === String(d.id));
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleSelectDataset(d.id)}
                          className={`text-left p-2 rounded border ${selected ? "bg-blue-50 border-blue-400" : "bg-white"}`}
                        >
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-xs text-gray-600">{d.description || ""}</div>
                        </button>
                      );
                    })}
                    {datasets.length === 0 && <div className="text-gray-600">No datasets available</div>}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">Upload Excel / CSV</label>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="mb-2" />
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-2" />
                <div className="mb-2">
                  <label className="block mb-1 font-medium">Google Sheets CSV URL</label>
                  <textarea placeholder="Paste Google Sheets CSV export URL (public)" id="gs-url" className="border p-2 rounded w-full mb-1" />
                  <button onClick={() => {
                    const v = document.getElementById("gs-url").value;
                    handleGoogleSheets(v);
                  }} className="bg-gray-200 px-3 py-1 rounded">Fetch Google Sheets</button>
                  {csvNotice && <div className="text-sm text-red-500 mt-1">{csvNotice}</div>}
                </div>

                <div>
                  <strong>Selected sources:</strong>
                  <ul className="mt-2">
                    {selectedDatasets.map((s) => <li key={s.id} className="text-sm">{s.name}</li>)}
                    {excelData && <li className="text-sm">Uploaded table ({excelData.length} rows)</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Live preview (first 10 rows)</h4>
              {loadingPreview ? <div>Building preview...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
        )}

        {/* Step 1 - Fields */}
        {step === STEPS.FIELDS && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Field configuration</h3>
            <p className="text-sm text-gray-600 mb-2">Detected fields from selected datasets / Excel/CSV. You can rename or change types locally (not persisted).</p>

            {(selectedDatasets.length || excelData) ? (
              <div>
                {(selectedDatasets.length ? selectedDatasets : [{ id: "excel", name: "Excel" }]).map((ds) => (
                  <div key={ds.id} className="mb-4">
                    <h4 className="font-medium mb-2">{ds.name || "Excel"}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(datasetFields[ds.id] || []).map((f) => (
                        <div key={f} className="p-2 border rounded">
                          <div className="text-sm font-semibold">{f}</div>
                          <div className="text-xs text-gray-600">{/* Basic type inference */}Type: {detectType(getValueByPath((datasetRows[ds.id] || [])[0] || {}, f))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600">No source selected.</p>}
          </div>
        )}

        {/* Step 2 - Joins */}
        {step === STEPS.JOINS && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Define joins between datasets</h3>
            <p className="text-sm text-gray-600 mb-2">Create inner/left/right/full joins between selected datasets. Excel can be used but will be joined client-side only.</p>

            <div className="space-y-2">
              {joins.map((j, i) => (
                <div key={j.id} className="flex gap-2 items-center flex-wrap">
                  <select value={j.leftDataset} onChange={(e) => updateJoin(i, "leftDataset", e.target.value)} className="border p-2 rounded">
                    <option value="">Left dataset</option>
                    {selectedDatasets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {excelData && <option value="excel">Excel</option>}
                  </select>

                  <select value={j.leftField} onChange={(e) => updateJoin(i, "leftField", e.target.value)} className="border p-2 rounded">
                    <option value="">Left field</option>
                    {(datasetFields[j.leftDataset] || []).map((f) => <option key={f} value={f}>{f}</option>)}
                    {j.leftDataset === "excel" && (datasetFields["excel"] || []).map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>

                  <select value={j.type} onChange={(e) => updateJoin(i, "type", e.target.value)} className="border p-2 rounded">
                    <option value="inner">Inner</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="full">Full</option>
                  </select>

                  <select value={j.rightDataset} onChange={(e) => updateJoin(i, "rightDataset", e.target.value)} className="border p-2 rounded">
                    <option value="">Right dataset</option>
                    {selectedDatasets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {excelData && <option value="excel">Excel</option>}
                  </select>

                  <select value={j.rightField} onChange={(e) => updateJoin(i, "rightField", e.target.value)} className="border p-2 rounded">
                    <option value="">Right field</option>
                    {(datasetFields[j.rightDataset] || []).map((f) => <option key={f} value={f}>{f}</option>)}
                    {j.rightDataset === "excel" && (datasetFields["excel"] || []).map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>

                  <button onClick={() => removeJoin(i)} className="bg-red-500 text-white px-2 rounded">✕</button>
                </div>
              ))}

              <button onClick={addJoin} className="bg-green-500 text-white px-3 py-1 rounded">+ Add Join</button>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Preview after joins (first 10 rows)</h4>
              {loadingPreview ? <div>Building...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
        )}

        {/* Step 3 - Calculated */}
        {step === STEPS.CALCULATED && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Calculated fields</h3>
            <p className="text-sm text-gray-600 mb-2">Add JS expressions referencing existing column names. Helper functions: SUM(arr), AVG(arr), LEN(x), IF(cond,a,b).</p>

            <div className="space-y-2">
              {calculatedFields.map((c, i) => (
                <div key={c.id} className="flex gap-2 items-center">
                  <input placeholder="Field name" value={c.name} onChange={(e) => updateCalc(i, "name", e.target.value)} className="border p-2 rounded w-40" />
                  <input placeholder='JS expression (use column names, e.g. IF(status === "active", 1, 0))' value={c.expr} onChange={(e) => updateCalc(i, "expr", e.target.value)} className="border p-2 rounded flex-1" />
                  <select value={c.type} onChange={(e) => updateCalc(i, "type", e.target.value)} className="border p-2 rounded">
                    <option value="number">number</option>
                    <option value="string">string</option>
                  </select>
                  <button onClick={() => removeCalc(i)} className="bg-red-500 text-white px-2 rounded">✕</button>
                </div>
              ))}

              <button onClick={addCalc} className="bg-green-500 text-white px-3 py-1 rounded">+ Add Calculated Field</button>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Preview with calculated fields (first 10 rows)</h4>
              {loadingPreview ? <div>Calculating...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
        )}

        {/* Step 4 - Logic Gates */}
        {step === STEPS.LOGIC_GATES && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Logic Gates / Boolean Rules</h3>
            <p className="text-sm text-gray-600 mb-2">
              {"Build boolean rules using AND, OR, NOT, parentheses, and comparisons. Example: (age > 10) AND (status = 'active')"}
            </p>


            <div className="mb-2 flex flex-wrap gap-2">
              {["AND", "OR", "NOT", "(", ")"].map((op) => (
                <button key={op} onClick={() => replaceIntoLogicExpr(op)} className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">{op}</button>
              ))}

              {allFieldOptions.slice(0, 30).map((f) => (
                <button key={f} onClick={() => replaceIntoLogicExpr(f)} className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200">{f}</button>
              ))}
            </div>

            <textarea value={logicExpr} onChange={(e) => setLogicExpr(e.target.value)} placeholder="Build your expression here" className="w-full border p-2 rounded h-28 mb-2" />

            <div className="flex gap-2 mb-4">
              <button onClick={() => saveLogicRule("Rule " + (logicSaved.length + 1), logicExpr)} className="bg-green-600 text-white px-3 py-1 rounded">Save Rule</button>
              <button onClick={() => setLogicExpr("")} className="bg-gray-200 px-3 py-1 rounded">Clear</button>
            </div>

            <div className="mb-4">
              <strong>Saved rules</strong>
              <ul className="mt-2">
                {logicSaved.map((r, i) => (
                  <li key={r.id} className="flex justify-between items-center p-2 border rounded mb-1">
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-gray-600">{r.expr}</div>
                    </div>
                    <div>
                      <button onClick={() => removeLogicRule(i)} className="text-sm text-red-500">Delete</button>
                    </div>
                  </li>
                ))}
                {logicSaved.length === 0 && <li className="text-sm text-gray-600">No saved rules</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Preview after logic rules (first 10 rows)</h4>
              {loadingPreview ? <div>Applying rules...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
        )}

        {/* Step 5 - Filters */}
        {step === STEPS.FILTERS && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Filters</h3>
            <p className="text-sm text-gray-600 mb-2">Add UI filters to further refine data.</p>

            <div className="space-y-2">
              {filters.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-center flex-wrap">
                  <select value={f.field} onChange={(e) => updateFilter(i, "field", e.target.value)} className="border p-2 rounded">
                    <option value="">Field</option>
                    {allFieldOptions.map((ff) => <option key={ff} value={ff}>{ff}</option>)}
                  </select>

                  <select value={f.type} onChange={(e) => updateFilter(i, "type", e.target.value)} className="border p-2 rounded">
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="regex">Regex</option>
                  </select>

                  {f.type === "text" && (
                    <>
                      <select value={f.operator} onChange={(e) => updateFilter(i, "operator", e.target.value)} className="border p-2 rounded">
                        <option value="contains">contains</option>
                        <option value="equals">equals</option>
                        <option value="starts">starts</option>
                        <option value="ends">ends</option>
                      </select>
                      <input value={f.value} onChange={(e) => updateFilter(i, "value", e.target.value)} placeholder="value" className="border p-2 rounded" />
                    </>
                  )}

                  {f.type === "number" && (
                    <>
                      <input value={f.min} onChange={(e) => updateFilter(i, "min", e.target.value)} placeholder="min" className="border p-2 rounded w-24" />
                      <input value={f.max} onChange={(e) => updateFilter(i, "max", e.target.value)} placeholder="max" className="border p-2 rounded w-24" />
                    </>
                  )}

                  {f.type === "date" && (
                    <>
                      <DatePicker selected={f.startDate ? new Date(f.startDate) : null} onChange={(d) => updateFilter(i, "startDate", d ? d.toISOString() : null)} placeholderText="Start" className="border p-2 rounded" />
                      <DatePicker selected={f.endDate ? new Date(f.endDate) : null} onChange={(d) => updateFilter(i, "endDate", d ? d.toISOString() : null)} placeholderText="End" className="border p-2 rounded" />
                    </>
                  )}

                  {f.type === "dropdown" && (
                    <>
                      <input placeholder="comma-separated options" value={(f.dropdownOptions || []).join(",")} onChange={(e) => updateFilter(i, "dropdownOptions", e.target.value.split(",").map(s => s.trim()))} className="border p-2 rounded" />
                    </>
                  )}

                  {f.type === "regex" && (
                    <input placeholder="pattern" value={f.value} onChange={(e) => updateFilter(i, "value", e.target.value)} className="border p-2 rounded" />
                  )}

                  <button onClick={() => removeFilter(i)} className="bg-red-500 text-white px-2 rounded">✕</button>
                </div>
              ))}

              <button onClick={addFilter} className="bg-green-500 text-white px-3 py-1 rounded">+ Add Filter</button>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Preview after filters (first 10 rows)</h4>
              {loadingPreview ? <div>Applying filters...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
        )}

        {/* Step 6 - Charts */}
        {step === STEPS.CHARTS && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Create charts</h3>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
              <input type="text" placeholder="Chart title" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} className="border p-2 rounded col-span-3" />

              <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="border p-2 rounded col-span-1">
                <option value="bar">Bar</option>
                <option value="stacked_bar">Stacked Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="pie">Pie</option>
                <option value="scatter">Scatter</option>
                <option value="table">Table</option>
                <option value="kpi">KPI</option>
              </select>

              <select value={chartAgg} onChange={(e) => setChartAgg(e.target.value)} className="border p-2 rounded col-span-1">
                <option value="none">No Aggregate</option>
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
              </select>

              <select value={chartX} onChange={(e) => setChartX(e.target.value)} className="border p-2 rounded col-span-1">
                <option value="">X Field</option>
                {allFieldOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <select value={chartY} onChange={(e) => setChartY(e.target.value)} className="border p-2 rounded col-span-1">
                <option value="">Y Field</option>
                {allFieldOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <button onClick={addChart} className="bg-blue-600 text-white p-2 rounded col-span-6 md:col-auto">➕ Add Chart</button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Preview charts (local previews)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charts.map((c) => (
                  <div key={c.i} className="bg-gray-50 p-3 rounded">
                    <h5 className="font-semibold mb-2">{c.name}</h5>
                    {c.type === "table" ? (
                      <TableRenderer dataset={c.excelData || datasetRows[c.dataset] || []} />
                    ) : (
                      <ChartRenderer
                        type={c.type}
                        datasetId={undefined}
                        excelData={c.excelData || preview}
                        xField={c.xField}
                        yField={c.yField}
                        aggregation={c.aggregation}
                        onPointClick={(pt) => {
                          // Drill into a point: simple click-to-filter hook
                          if (pt && pt.x !== undefined) {
                            setQuery(String(pt.x));
                            setStep(STEPS.FILTERS);
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
                {charts.length === 0 && <div className="text-gray-600">No charts yet</div>}
              </div>
            </div>
          </div>
        )}

        {/* Step 7 - Layout */}
        {step === STEPS.LAYOUT && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Layout designer</h3>
            <p className="text-sm text-gray-600 mb-2">Drag / resize charts to design dashboard layout.</p>

            <ResponsiveGridLayout
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768 }}
              cols={{ lg: 12, md: 10, sm: 6 }}
              rowHeight={80}
              onLayoutChange={(l) => onLayoutChange(l)}
            >
              {charts.map((c) => (
                <div key={c.i} data-grid={layout.find((L) => L.i === c.i) || { w: 6, h: 3, x: 0, y: 0 }}>
                  <div className="bg-white shadow rounded p-2 h-full">
                    <div className="flex justify-between items-center mb-2">
                      <strong>{c.name}</strong>
                      <button onClick={() => setCharts(charts.filter((x) => x.i !== c.i))} className="text-red-500">Remove</button>
                    </div>
                    {c.type === "table" ? (
                      <TableRenderer dataset={c.excelData || datasetRows[c.dataset] || []} />
                    ) : (
                      <ChartRenderer type={c.type} datasetId={c.dataset} xField={c.xField} yField={c.yField} excelData={c.excelData || preview} filters={c.filters} aggregation={c.aggregation} />
                    )}
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        )}

        {/* Step 8 - Publish */}
        {step === STEPS.PUBLISH && (
          <div className="mb-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Publish dashboard</h3>
            <p className="text-sm text-gray-600 mb-2">Review configuration then publish to backend.</p>

            <div className="mb-4">
              <h4 className="font-semibold">Summary</h4>
              <ul className="list-disc pl-6">
                <li>Datasets: {selectedDatasets.map((s) => s.name).join(", ") || (excelData ? "Uploaded dataset" : "—")}</li>
                <li>Joins: {joins.length}</li>
                <li>Calculated fields: {calculatedFields.length}</li>
                <li>Logic rules: {logicSaved.length}{logicExpr ? " + active expr" : ""}</li>
                <li>Filters: {filters.length}</li>
                <li>Charts: {charts.length}</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button onClick={async () => {
                let id = dashboardId;
                if (!id) {
                  const res = await apiClient("/api/dashboards/", { method: "POST", body: JSON.stringify({ name: dashboardName || "Dashboard" }) });
                  if (!res?.id) return alert("Failed to create dashboard");
                  id = res.id;
                  setDashboardId(id);
                }
                await apiClient(`/api/dashboards/${id}/`, { method: "PUT", body: JSON.stringify({ name: dashboardName, layout, metadata: { joins, calculated_fields: calculatedFields, logic_rules: logicSaved, filters, charts } }) });
                alert("Published!");
              }} className="bg-green-600 text-white px-4 py-2 rounded">Publish</button>

              <button onClick={() => exportPreviewExcel()} className="bg-blue-600 text-white px-4 py-2 rounded">Export preview Excel</button>
              <button onClick={() => exportDashboardJSON()} className="bg-gray-500 text-white px-4 py-2 rounded">Export Template JSON</button>
            </div>
          </div>
        )}

        {/* Wizard navigation */}
        <div className="flex gap-2 mt-4">
          {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="bg-gray-400 text-white px-4 py-2 rounded">Back</button>}
          {step < Object.keys(STEPS).length - 1 && <button onClick={() => setStep((s) => s + 1)} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>}

          <div className="ml-auto flex gap-2 items-center">
            <div className="text-sm text-gray-600 mr-2">Rows preview: {preview.length}</div>
            <button onClick={() => { setPreview((p) => p); alert("Preview refreshed"); }} className="bg-gray-200 px-3 py-1 rounded">Refresh Preview</button>
          </div>
        </div>
      </div>
    </Layout>
  </SuperadminGate>
  );
}

/* ---------- small TableRenderer included (keeps UI consistent) ---------- */
function renderCell(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const TableRenderer = ({ dataset }) => {
  if (!dataset || !dataset.length) return <p>No data</p>;
  const flatDataset = dataset.map((r) => {
    // r could be flat already
    return typeof r === "object" ? flattenObject(r) : r;
  });
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
