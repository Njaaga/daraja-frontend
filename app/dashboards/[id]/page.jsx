"use client";

import { useState, useMemo } from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";

export default function ChartDetailsModal({ open, onClose, rows, selectedFields }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  if (!open || !rows?.length) return null;

  // Filtered & searched rows
  const filteredRows = useMemo(() => {
    let output = [...rows];

    // Column search
    Object.entries(search).forEach(([field, term]) => {
      if (!term) return;
      output = output.filter((r) =>
        String(r[field] ?? "")
          .toLowerCase()
          .includes(term.toLowerCase())
      );
    });

    // Sorting
    if (sortField) {
      output.sort((a, b) => {
        const valA = a[sortField] ?? "";
        const valB = b[sortField] ?? "";
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return output;
  }, [rows, search, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // CSV / Excel export
  const handleExcelExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ChartData");
    XLSX.writeFile(wb, "chart_data.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20 p-4">
      <div className="bg-white w-full max-w-6xl rounded shadow-lg p-6 overflow-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold">Chart Data</h3>
          <div className="flex gap-2">
            <button onClick={handleExcelExport} className="bg-green-600 text-white px-3 py-1 rounded">
              Export Excel
            </button>
            <CSVLink
              data={filteredRows}
              filename="chart_data.csv"
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Export CSV
            </CSVLink>
            <button onClick={onClose} className="text-red-500 font-semibold px-3 py-1 rounded border">
              Close
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mb-2">
          <table className="border w-full">
            <thead>
              <tr>
                {selectedFields.map((f) => (
                  <th key={f} className="border p-2 cursor-pointer">
                    <div className="flex flex-col">
                      <span
                        onClick={() => {
                          if (sortField === f) {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortField(f);
                            setSortOrder("asc");
                          }
                        }}
                        className="flex items-center justify-between"
                      >
                        {f}
                        {sortField === f ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </span>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="border rounded px-1 py-0.5 text-sm"
                        value={search[f] || ""}
                        onChange={(e) => setSearch((s) => ({ ...s, [f]: e.target.value }))}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => (
                <tr key={i}>
                  {selectedFields.map((f, j) => (
                    <td key={j} className="border p-2">{String(row[f] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2 flex-wrap">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
              />{" "}
              of {totalPages}
            </span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
            <select
              className="border rounded px-2 py-1"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 50, 100].map((r) => (
                <option key={r} value={r}>{r} rows</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
