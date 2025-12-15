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

export default function DatasetRunner({ data }) {
  if (!data || (Array.isArray(data) && data.length === 0))
    return <div className="text-gray-500 mt-4">No data returned.</div>;

  // Ensure data is always an array
  const rows = Array.isArray(data) ? data : [data];

  // Collect all unique columns from all rows
  const columnsSet = new Set();
  const flattenedRows = rows.map((row) => {
    const flat = flattenObject(row);
    Object.keys(flat).forEach((k) => columnsSet.add(k));
    return flat;
  });
  const columns = Array.from(columnsSet);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Preview</h3>

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
                      ? String(row[col])
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
