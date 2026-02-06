"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import { apiClient } from "@/lib/apiClient";

// ---------------- Modal Table Component ----------------
function ChartDetailsModal({ open, onClose, rows, selectedFields }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  if (!open) return null;
  if (!rows?.length) return null;

  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const paginated = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20 p-4">
      <div className="bg-white w-full max-w-5xl rounded shadow-lg p-6 overflow-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Chart Data</h3>
          <button onClick={onClose} className="text-red-500">Close</button>
        </div>

        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead>
              <tr>
                {selectedFields.map((f) => (
                  <th key={f} className="border p-2">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
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

// ---------------- Dashboard View ----------------

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  // Fetch dashboard
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mappedCharts = (db.dashboard_charts || []).map((dc) => {
          const c = dc.chart_detail;
          return {
            key: dc.id,
            chartId: dc.chart,
            title: c.name || c.y_field,
            datasetId: c.dataset,
            type: c.chart_type,
            xField: c.x_field,
            yField: c.y_field,
            aggregation: c.aggregation,
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
            joins: c.joins || [],
            excelData: c.excel_data || null,
            selectedFields: c.selected_fields || [],
            stackedFields: c.stacked_fields || [],
          };
        });

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

  // Handle chart click → open modal
  const handleChartClick = (chart, rows) => {
    setModalRows(rows || []);
    setModalFields(chart.selectedFields || []);
    setModalOpen(true);
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">{dashboard?.name}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <div key={c.key} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">{c.title}</h3>
              </div>

              <ChartRenderer
                datasetId={c.datasetId}
                type={c.type}
                xField={c.xField}
                yField={c.yField}
                stackedFields={c.stackedFields}
                excelData={c.excelData}
                logicRules={c.logicRules}
                selectedFields={c.selectedFields}
                filters={c.filters}
                onPointClick={(payload) => handleChartClick(c, payload.rows)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal Table */}
      <ChartDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rows={modalRows}
        selectedFields={modalFields}
      />
    </Layout>
  );
}
