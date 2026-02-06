"use client";

import * as XLSX from "xlsx";

export default function ChartDetailsModal({ open, onClose, rows = [], selectedFields = [] }) {
  if (!open) return null;

  const fields = selectedFields.length
    ? selectedFields
    : rows.length
    ? Object.keys(rows[0])
    : [];

  const exportExcel = () => {
    if (!rows || rows.length === 0) return;

    const data = rows.map(r => {
      const obj = {};
      fields.forEach(f => obj[f] = r[f]);
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Details");
    XLSX.writeFile(workbook, "chart-details.xlsx");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[90%] max-w-6xl rounded shadow-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Drill-down Data</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black text-xl font-bold">
            ✕
          </button>
        </div>

        <div className="flex justify-end mb-3">
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
          >
            Export Excel
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No matching data.</p>
        ) : (
          <div className="overflow-auto max-h-[70vh] border rounded">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {fields.map(f => (
                    <th key={f} className="border px-3 py-2 text-left font-semibold">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {fields.map(f => (
                      <td key={f} className="border px-3 py-1">{String(row[f] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
