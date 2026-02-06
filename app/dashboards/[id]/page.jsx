"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import { apiClient } from "@/lib/apiClient";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ===================== UTIL ===================== */

const exportCSV = (rows, columns, filename) => {
  const csv =
    [columns.join(",")]
      .concat(
        rows.map((r) =>
          columns.map((c) => `"${r[c] ?? ""}"`).join(",")
        )
      )
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/* ===================== DETAILS MODAL ===================== */

function ChartDetailsModal({
  chart,
  filter,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(null);

  if (!chart) return null;

  const rows = chart.excelData || [];
  const columns =
    chart.selectedFields ||
    (rows[0] ? Object.keys(rows[0]) : []);

  const filteredRows = useMemo(() => {
    let r = [...rows];

    if (filter) {
      r = r.filter(
        (row) => row[filter.field] === filter.value
      );
    }

    if (search) {
      r = r.filter((row) =>
        columns.some((c) =>
          row[c]?.toString().toLowerCase().includes(search)
        )
      );
    }

    if (sort) {
      r.sort((a, b) =>
        a[sort] > b[sort] ? 1 : -1
      );
    }

    return r;
  }, [rows, filter, search, sort]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-11/12 max-w-7xl p-6 rounded shadow-lg">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-lg">
            {chart.title} – Details
          </h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            placeholder="Search…"
            className="border px-2 py-1 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={() =>
              exportCSV(
                filteredRows,
                columns,
                `${chart.title}.csv`
              )
            }
            className="bg-gray-200 px-3 py-1 rounded"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-auto max-h-[70vh] border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    onClick={() => setSort(c)}
                    className="cursor-pointer px-3 py-2 border-b"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 border-b">
                      {r[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===================== PAGE ===================== */

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const ref = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [detailChart, setDetailChart] = useState(null);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    apiClient(`/api/dashboards/${id}/`).then((db) => {
      setDashboard(db);
      setCharts(
        db.dashboard_charts.map((dc) => ({
          ...dc.chart_detail,
          key: dc.id,
        }))
      );
    });
  }, [id]);

  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current);
    const pdf = new jsPDF();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      210,
      297
    );
    pdf.save(`${dashboard.name}.pdf`);
  };

  return (
    <Layout>
      <div className="p-6" ref={ref}>
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">{dashboard?.name}</h2>
          <button onClick={exportPDF}>Export PDF</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <div key={c.key} className="bg-white p-4 shadow rounded">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">{c.name}</h3>
                <button
                  onClick={() => {
                    setDetailChart(c);
                    setFilter(null);
                  }}
                >
                  ⛶
                </button>
              </div>

              <ChartRenderer
                data={c.excel_data}
                xField={c.x_field}
                yField={c.y_field}
                type={c.chart_type}
                onPointClick={({ x }) => {
                  setDetailChart(c);
                  setFilter({ field: c.x_field, value: x });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {detailChart && (
        <ChartDetailsModal
          chart={detailChart}
          filter={filter}
          onClose={() => setDetailChart(null)}
        />
      )}
    </Layout>
  );
}
