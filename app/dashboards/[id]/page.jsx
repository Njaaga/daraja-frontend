"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- Rename ---------- */
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  /* ---------- Drilldown Modal ---------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  /* ================= FETCH DASHBOARD ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);
        setNewName(db.name);

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
            logicExpression: c.logic_expression || null,
            joins: c.joins || [],
            excelData: c.excel_data || null,
            selectedFields: c.selected_fields || [],
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

  /* ================= ACTIONS ================= */

  const handleRename = async () => {
    if (!newName.trim()) return alert("Name cannot be empty");
    try {
      setSavingName(true);
      await apiClient(`/api/dashboards/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      setDashboard((d) => ({ ...d, name: newName }));
      setRenaming(false);
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!confirm("Delete this chart?")) return;
    await apiClient(`/api/charts/${chartId}/`, { method: "DELETE" });
    setCharts((prev) => prev.filter((c) => c.chartId !== chartId));
  };

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

  /* ================= DRILLDOWN HANDLER ================= */
  const handleSliceClick = (rows, selectedFields) => {
    setModalRows(rows);
    setModalFields(selectedFields);
    setModalOpen(true);
  };

  /* ================= RENDER ================= */

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        {/* ============ HEADER ============ */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboards")}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back
            </button>

            {!renaming ? (
              <>
                <h2 className="text-2xl font-bold">{dashboard.name}</h2>
                <button
                  onClick={() => setRenaming(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Rename
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <button
                  onClick={handleRename}
                  disabled={savingName}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setRenaming(false);
                    setNewName(dashboard.name);
                  }}
                  className="text-sm text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportPDF}
            className="bg-gray-200 px-3 py-1 rounded"
          >
            Export PDF
          </button>
        </div>

        {/* ============ DASHBOARD ============ */}
        <div ref={dashboardRef}>
          {charts.length === 0 && (
            <p className="text-gray-600">No charts yet.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((c) => (
              <div key={c.key} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{c.title}</h3>
                  <button
                    onClick={() => handleDeleteChart(c.chartId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>

                <ChartRenderer
                  datasetId={c.datasetId}
                  excelData={c.excelData}
                  type={c.type}
                  xField={c.xField}
                  yField={c.yField}
                  aggregation={c.aggregation}
                  filters={c.filters}
                  logicRules={c.logicRules}
                  logicExpression={c.logicExpression}
                  joins={c.joins}
                  selectedFields={c.selectedFields}
                  onSliceClick={handleSliceClick}   // ✅ NEW
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ MODAL ============ */}
      <ChartDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rows={modalRows}
        selectedFields={modalFields}
      />
    </Layout>
  );
}
