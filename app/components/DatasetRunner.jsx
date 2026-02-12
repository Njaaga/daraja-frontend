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
  // Determine actual rows
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : Array.isArray(data)
    ? data
    : [];

  // Determine fields
  const fields =
    Array.isArray(data?.fields) && data.fields.length > 0
      ? data.fields
      : (() => {
          // If fields not provided, infer from first row
          if (rows.length > 0) return Object.keys(flattenObject(rows[0]));
          return [];
        })();

  if (!rows.length)
    return <div className="text-gray-500 mt-4">No data returned.</div>;

  // Flatten rows
  const flattenedRows = rows.map((row) => flattenObject(row));

  // Table columns
  const columnsSet = new Set(fields);
  flattenedRows.forEach((row) => Object.keys(row).forEach((k) => columnsSet.add(k)));
  const columns = Array.from(columnsSet);

  return (
    <div className="mt-6 space-y-4">
      {/* Debug / info */}
      <div className="bg-gray-50 p-4 rounded-xl border">
        <h4 className="font-semibold mb-2">Preview Info</h4>
        {apiSource && (
          <div>
            <strong>API Source:</strong> {apiSource}
          </div>
        )}
        {endpoint && (
          <div>
            <strong>Endpoint:</strong> {endpoint}
          </div>
        )}
        {queryParams && Object.keys(queryParams).length > 0 && (
          <div>
            <strong>Query Params:</strong> {JSON.stringify(queryParams)}
          </div>
        )}
        {data?.meta && (
          <div>
            <strong>Count:</strong> {data.meta.count} | <strong>Entity:</strong>{" "}
            {data.meta.entity || "-"}
          </div>
        )}
      </div>

      {/* Raw JSON preview (truncated) */}
      <div className="bg-gray-100 p-4 rounded-xl overflow-auto max-h-40">
        <pre className="text-sm">{truncate(JSON.stringify(rows, null, 2), 500)}</pre>
      </div>

      {/* Flattened table */}
      <div className="overflow-auto border rounded-xl max-h-80">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="p-2 border-b font-medium text-left whitespace-nowrap"
                >
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
