"use client";

import React from "react";

// Recursive function to flatten nested objects for display
function flattenObject(obj, parentKey = "") {
  if (!obj || typeof obj !== "object") return {};
  let items = {};
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(items, flattenObject(value, newKey));
    } else {
      items[newKey] = value;
    }
  });
  return items;
}

// Helper to truncate long strings
function truncate(val, length = 50) {
  const str = String(val);
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export default function DatasetRunner({ data, apiSource, endpoint, queryParams }) {
  if (!data || (Array.isArray(data) && data.length === 0))
    return <div className="text-gray-500 mt-4">No data returned.</div>;

  const rows = Array.isArray(data) ? data : [data];

  const columnsSet = new Set();
  const flattenedRows = rows.map((row) => {
    const flat = flattenObject(row);
    Object.keys(flat).forEach((k) => columnsSet.add(k));
    return flat;
  });
  const columns = Array.from(columnsSet);

  return (
    <div className="mt-6 space-y-4">
      {/* Debug / info */}
      <div className="bg-gray-50 p-4 rounded-xl border">
        <h4 className="font-semibold mb-2">Preview Info</h4>
        {apiSource && <div><strong>API Source:</strong> {apiSource}</div>}
        {endpoint && <div><strong>Endpoint:</strong> {endpoint}</div>}
        {queryParams && Object.keys(queryParams).length > 0 && (
          <div>
            <strong>Query Params:</strong>{" "}
            {JSON.stringify(queryParams)}
          </div>
        )}
      </div>

      {/* Raw JSON preview (truncated) */}
      <div className="bg-gray-100 p-4 rounded-xl overflow-auto max-h-40">
        <pre className="text-sm">{truncate(JSON.stringify(data, null, 2), 500)}</pre>
      </div>

      {/* Flattened table */}
      <div className="overflow-auto border rounded-xl max-h-80">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="p-2 border-b font-medium text-left">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flattenedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="p-2 border-b">
                    {row[col] !== undefined && row[col] !== null
                      ? Array.isArray(row[col])
                        ? row[col].map((x) => JSON.stringify(x)).join(", ")
                        : truncate(row[col])
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
