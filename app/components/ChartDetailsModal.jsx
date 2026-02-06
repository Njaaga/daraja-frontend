"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

export default function ChartDetailsModal({
  open,
  onClose,
  rows,
  selectedFields,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  if (!open || !rows?.length) return null;

  /* ---------------- FILTER + SORT ---------------- */
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
        const A = a[sortField];
        const B = b[sortField];

        if (!isNaN(A) && !isNaN(B)) {
          return sortOrder === "asc" ? A - B : B - A;
        }

        return sortOrder === "asc"
          ? String(A ?? "").localeCompare(String(B ?? ""))
          : String(B ?? "").localeCompare(String(A ?? ""));
      });
    }

    return output;
  }, [rows, search, sortField, sortOrder]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ---------------- EXCEL EXPORT ---------------- */
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chart Data");
    XLSX.writeFile(workbook, "chart_data.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20 p-4">
      <div className="bg-white w-full max-w-6xl rounded shadow-lg p-6 max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold">Chart Data</h3>
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Export Excel
            </button>
            <button
              onClick={onClose}
              className="border px-3 py-1 rounded text-red-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead>
              <tr>
                {selectedFields.map((f) => (
                  <th key={f} className="border p-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          if (sortField === f) {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortField(f);
                            setSortOrder("asc");
                          }
                        }}
                        className="flex justify-between items-center font-semibold"
                      >
                        {f}
                        {sortField === f && (sortOrder === "asc" ? " ▲" : " ▼")}
                      </button>
                      <input
                        className="border rounded px-1 py-0.5 text-sm"
                        placeholder="Search…"
                        value={search[f] || ""}
                        onChange={(e) =>
                          setSearch((s) => ({ ...s, [f]: e.target.value }))
                        }
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
                    <td key={j} className="border p-2">
                      {String(row[f] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
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
                value={currentPage}
                min={1}
                max={totalPages}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= totalPages) setCurrentPage(v);
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
                <option key={r} value={r}>
                  {r} rows
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
