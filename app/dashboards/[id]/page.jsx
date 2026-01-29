"use client";

import { useEffect, useState, useRef } from "react";
import Layout from "@/app/components/Layout";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);
        setNewName(db.name);

        if (db.dashboard_charts) {
          const mapped = db.dashboard_charts.map((dc) => {
            const cd = dc.chart_detail;

            return {
              i: dc.id.toString(),
              chartId: dc.chart,
              title: cd.name || cd.y_field,
              datasetId: cd.dataset,
              type: cd.chart_type,
              xField: cd.x_field,
              yField: cd.y_field,
              aggregation: cd.aggregation,
              filters: cd.filters || {},
              logicRules: cd.logic_rules || [],
              logicExpression: cd.logic_expression || null,
              joins: cd.joins || [],
              excelData: cd.excel_data || null,
            };
          });

          setCharts(mapped);
        }
      } catch (err) {
        console.error(err);
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  const handleRename = async () => {
    if (!newName.trim()) {
      alert("Dashboard name cannot be empty");
      return;
    }

    setSavingName(true);

    try {
      const res = await apiClient(`/api/dashboards/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });

      setDashboard((prev) => ({ ...prev, name: newName }));
      setRenaming(false);
    } catch (err) {
      console.error(err);
      alert("Failed to rename dashboard");
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!confirm("Delete this chart?")) return;

    try {
      await apiClient(`/api/charts/${chartId}/`, { method: "DELETE" });
      setCharts((prev) => prev.filter((c) => c.chartId !== chartId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete chart");
    }
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${dashboard?.name || "dashboard"}.pdf`);
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border rounded px-2 py-1"
                  disabled={savingName}
                />
                <button
                  onClick={handleRename}
                  disabled={savingName}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setRenaming(false);
                    setNewName(dashboard.name);
                  }}
                  className="text-gray-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportPDF}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Export PDF
          </button>
        </div>

        {/* Dashboard Content */}
        <div ref={dashboardRef}>
          {charts.length === 0 && <p>No charts yet.</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((c) => (
              <div key={c.i} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-2">
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
                  filters={c.filters}
                  logicRules={c.logicRules}
                  logicExpression={c.logicExpression}
                  joins={c.joins}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
