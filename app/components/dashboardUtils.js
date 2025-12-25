// app/lib/dashboardUtils.js
import * as XLSX from "xlsx";

/* --------------------- Utilities --------------------- */
export const flattenObject = (obj, prefix = "") =>
  Object.keys(obj || {}).reduce((res, k) => {
    const pre = prefix.length ? prefix + "." : "";
    const val = obj[k];
    if (val === null || val === undefined) {
      res[pre + k] = val;
    } else if (Array.isArray(val)) {
      res[pre + k] = val;
    } else if (typeof val === "object") {
      Object.assign(res, flattenObject(val, pre + k));
    } else {
      res[pre + k] = val;
    }
    return res;
  }, {});

export function getValueByPath(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export const detectType = (v) => {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number" && !isNaN(v)) return "number";
  if (!isNaN(Date.parse(String(v)))) return "date";
  return typeof v;
};

export const normalizeForExport = (rows) =>
  (rows || []).map((r) => {
    const flat = flattenObject(r);
    const out = {};
    Object.entries(flat).forEach(([k, v]) => {
      if (Array.isArray(v)) out[k] = v.map((i) => (typeof i === "object" ? JSON.stringify(i) : String(i))).join(", ");
      else out[k] = v;
    });
    return out;
  });

/* --------------------- Calculated Fields --------------------- */
export function buildCalcExecutor(expr, fieldKeys) {
  const helpers = {
    SUM: (arr) => (Array.isArray(arr) ? arr.reduce((s, x) => s + Number(x || 0), 0) : Number(arr) || 0),
    AVG: (arr) => (Array.isArray(arr) && arr.length ? arr.reduce((s, x) => s + Number(x || 0), 0) / arr.length : Number(arr) || 0),
    LEN: (x) => (x == null ? 0 : Array.isArray(x) ? x.length : String(x).length),
    IF: (cond, a, b) => (cond ? a : b),
    JSONPARSE: (s) => { try { return JSON.parse(s); } catch { return null; } },
  };

  const args = [...fieldKeys, "__helpers"];
  const body = `
    try { const {SUM,AVG,LEN,IF,JSONPARSE} = __helpers; return (${expr}); } 
    catch(e) { return null; }
  `;
  try {
    const fn = new Function(...args, body);
    return (rowValues) => fn(...rowValues, helpers);
  } catch (err) {
    console.warn("Failed to build calc function:", expr, err);
    return () => null;
  }
}

/* --------------------- Logic Engine --------------------- */
export function sanitizeIdentifier(k) {
  return String(k).replace(/[^a-zA-Z0-9_]/g, "_");
}

export function convertToJsExpression(expr) {
  if (!expr || !String(expr).trim()) return "true";
  let s = String(expr);
  s = s.replace(/\bAND\b/gi, "&&").replace(/\bOR\b/gi, "||").replace(/\bNOT\b/gi, "!");
  s = s.replace(/(\b[\w.]+\b)\s+CONTAINS\s+"([^"]*)"/gi, 'String($1 || "").includes("$2")');
  s = s.replace(/(\b[\w.]+\b)\s+STARTS WITH\s+"([^"]*)"/gi, 'String($1 || "").startsWith("$2")');
  s = s.replace(/(\b[\w.]+\b)\s+ENDS WITH\s+"([^"]*)"/gi, 'String($1 || "").endsWith("$2")');
  s = s.replace(/(?<![=!<>])=(?!=)/g, "===");
  return s;
}

export function evaluateExpressionForRow(row, rawExpr, getVal = getValueByPath) {
  if (!rawExpr || !String(rawExpr).trim()) return true;
  const expr = convertToJsExpression(rawExpr);

  const idPattern = /\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g;
  const matches = new Set();
  let m;
  while ((m = idPattern.exec(expr))) {
    const tok = m[1];
    if (/^(true|false|null|undefined|NaN|Infinity|AND|OR|NOT)$/.test(tok)) continue;
    if (!isNaN(Number(tok))) continue;
    matches.add(tok);
  }

  const sanitizedKeys = [];
  const values = [];
  const mapping = {};
  matches.forEach((k) => {
    const sk = sanitizeIdentifier(k);
    mapping[k] = sk;
    sanitizedKeys.push(sk);
    values.push(getVal(row, k));
  });

  let safeExpr = expr;
  Array.from(matches).sort((a, b) => b.length - a.length).forEach((k) => {
    const sk = mapping[k];
    const re = new RegExp("\\b" + k.replace(/\./g, "\\.") + "\\b", "g");
    safeExpr = safeExpr.replace(re, sk);
  });

  try {
    const fn = new Function(...sanitizedKeys, `return (${safeExpr});`);
    return !!fn(...values);
  } catch (err) {
    console.warn("Expression eval error:", err, rawExpr, safeExpr, row);
    return false;
  }
}

/* --------------------- Join Engine --------------------- */
export function runJoins(sourcesMap, joinsCfg, primaryKey, sampleLimit = 5000, getVal = getValueByPath, flatten = flattenObject) {
  // Keep the same code as your original join logic...
}

/* --------------------- Filters --------------------- */
export const applyFiltersToRows = (rows, filters, getVal = getValueByPath) => {
  // Keep the same code as your original filters logic...
};

/* --------------------- Export helpers --------------------- */
export function exportToExcel(rows, name = "export.xlsx") {
  if (!rows || !rows.length) return alert("No data to export");
  const ws = XLSX.utils.json_to_sheet(normalizeForExport(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, name);
}

export function exportDashboardTemplate(obj, name = "dashboard-template.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
