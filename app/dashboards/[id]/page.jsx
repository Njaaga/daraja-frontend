"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ===================== DETAILS MODAL ===================== */

function ChartDetailsModal({ chart, onClose }) {
  if (!chart) return null;

  const rows = chart.excelData || [];
  const columns =
    chart.selectedFields ||
    (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-11/12 max-w-6xl rounded shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {chart.title} — Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto max-h-[70vh] border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left border-b font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 border-b">
                      {row[col]?.toString() ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="p-4 text-gray-500">No detail data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD VIEW ===================== */

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [detailChart, setDetailChart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  /* ===================== FETCH DASHBOARD ===================== */

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
            excelData: c.excel_data || [],
            selectedFields: c.selected_fields || null,
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

  /* ===================== ACTIONS ===================== */

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

  /* ===================== RENDER ===================== */

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        {/* HEADER */}
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

        {/* DASHBOARD */}
        <div ref={dashboardRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((c) => (
              <div key={c.key} className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2">{c.title}</h3>

                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setDetailChart(c);
                    setShowDetails(true);
                  }}
                >
                  <ChartRenderer {...c} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDetails && (
        <ChartDetailsModal
          chart={detailChart}
          onClose={() => {
            setShowDetails(false);
            setDetailChart(null);
          }}
        />
      )}
    </Layout>
  );
}
