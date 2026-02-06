"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import { apiClient } from "@/lib/apiClient";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* -------------------- CSV EXPORT -------------------- */
const exportCSV = (rows, columns, filename) => {
  const csv =
    [columns.join(",")]
      .concat(
        rows.map((r) => columns.map((c) => `"${r[c] ?? ""}"`).join(","))
      )
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/* -------------------- MODAL -------------------- */
function ChartDetailsModal({ rows, selectedFields, chartName, onClose }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(null);

  if (!rows || rows.length === 0) return null;

  const columns = selectedFields?.length
    ? selectedFields
    : Object.keys(rows[0] || {});

  const filteredRows = useMemo(() => {
    let r = [...rows];

    if (search) {
      r = r.filter((row) =>
        columns.some((c) =>
          row[c]?.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    if (sort) {
      r.sort((a, b) => (a[sort] > b[sort] ? 1 : -1));
    }

    return r;
  }, [rows, search, sort, columns]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white w-full max-w-6xl p-6 rounded shadow-lg">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-lg">{chartName} – Details</h3>
          <button className="text-xl" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            placeholder="Search…"
            className="border px-2 py-1 rounded flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() => exportCSV(filteredRows, columns, `${chartName}.csv`)}
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-auto max-h-[70vh] border rounded">
          <table className="min-w-full text-sm border-collapse">
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
                <tr key={i} className="even:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 border-b">{r[c]}</td>
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

/* -------------------- DASHBOARD VIEW -------------------- */
export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);
  const [modalChartName, setModalChartName] = useState("");

  /* -------------------- FETCH DASHBOARD -------------------- */
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mappedCharts = (db.dashboard_charts || []).map((dc) => ({
          ...dc.chart_detail,
          key: dc.id,
        }));

        setCharts(mappedCharts);
      } catch (err) {
        console.error(err);
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  /* -------------------- EXPORT PDF -------------------- */
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`${dashboard.name}.pdf`);
  };

  /* -------------------- HANDLE CHART CLICK -------------------- */
  const handleChartClick = (chart, clickedRows) => {
    setModalRows(clickedRows || []);
    setModalFields(chart.selected_fields || []);
    setModalChartName(chart.name);
  };

  /* -------------------- RENDER -------------------- */
  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboards")}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          </div>

          <button
            onClick={handleExportPDF}
            className="bg-gray-200 px-3 py-1 rounded"
          >
            Export PDF
          </button>
        </div>

        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <div key={c.key} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">{c.name}</h3>
              </div>

              <ChartRenderer
                datasetId={c.dataset}
                type={c.chart_type}
                xField={c.x_field}
                yField={c.y_field}
                excelData={c.excel_data}
                logicRules={c.logic_rules || []}
                selectedFields={c.selected_fields || []}
                stackedFields={c.stacked_fields || []}
                filters={{}}
                onPointClick={(payload) => {
                  // payload.__rows contains exact data
                  handleChartClick(c, payload.__rows || [payload.__row || payload]);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {modalRows.length > 0 && (
        <ChartDetailsModal
          rows={modalRows}
          selectedFields={modalFields}
          chartName={modalChartName}
          onClose={() => setModalRows([])}
        />
      )}
    </Layout>
  );
}
