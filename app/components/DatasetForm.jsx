"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function DatasetForm({ apiSource }) {
  const router = useRouter();
  const [entity, setEntity] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch fields + mock data for the selected entity
  useEffect(() => {
    const fetchEntityData = async () => {
      if (!apiSource?.id || !entity) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/api-sources/${apiSource.id}/entity_fields/${entity}/`
        );
        const data = await res.json();

        if (res.ok) {
          setColumns(data.fields || []);
          setRows(data.data || []);
        } else {
          setError(data.error || "Failed to fetch entity data");
          setColumns([]);
          setRows([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch entity data");
        setColumns([]);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntityData();
  }, [apiSource, entity]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Dataset Viewer</h2>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Entity selector */}
      <select
        value={entity}
        onChange={(e) => setEntity(e.target.value)}
        className="border p-3 rounded-lg mb-4"
      >
        <option value="">Select Entity</option>
        <option value="Customer">Customer</option>
        <option value="Invoice">Invoice</option>
        <option value="Account">Account</option>
        <option value="Payment">Payment</option>
      </select>

      {loading && <div>Loading data...</div>}

      {/* Table showing fields + mock data */}
      {!loading && columns.length > 0 && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border px-4 py-2 text-left bg-gray-100"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col} className="border px-4 py-2">
                      {row[col] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && entity && rows.length === 0 && (
        <div className="mt-4 text-gray-500">No data available</div>
      )}
    </div>
  );
}
