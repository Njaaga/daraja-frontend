"use client";

import { useEffect, useState, useRef } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { lab, rgb } from "d3-color";

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardRef = useRef(); // Capture dashboard DOM

  // -----------------------------
  // Fetch dashboard data
  // -----------------------------
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        if (db.dashboard_charts) {
          const mappedCharts = db.dashboard_charts.map((dc) => {
            const chartDetail = dc.chart_detail;
            return {
              i: dc.id.toString(),
              chartId: dc.chart,
              title: chartDetail.name || chartDetail.label || chartDetail.y_field,
              datasetId: chartDetail.dataset,
              type: chartDetail.chart_type,
              xField: chartDetail.x_field,
              yField: chartDetail.y_field,
              aggregation: chartDetail.aggregation,
              filters: chartDetail.filters || {},
              logicRules: chartDetail.logic_rules || [],
              logicExpression: chartDetail.logic_expression || null,
              joins: chartDetail.joins || [],
              excelData: chartDetail.excel_data || null,
              // Safe colors: convert LAB -> RGB
              colors: (chartDetail.colors || []).map((c) => {
                if (c.startsWith("lab")) {
                  try {
                    return rgb(lab(c)).toString();
                  } catch {
                    return "#000"; // fallback
                  }
                }
                return c;
              }),
            };
          });

          setCharts(mappedCharts);
        }
      } catch (err) {
        console.error(err);
        setError(
          err.status === 403
            ? "You do not have permission to view this dashboard."
            : "Dashboard not found."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  // -----------------------------
  // Delete chart
  // -----------------------------
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

  // -----------------------------
  // Export dashboard as PDF
  // -----------------------------
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    // Clone dashboard DOM to safely modify colors
    const clone = dashboardRef.current.cloneNode(true);

    // Convert any inline LAB colors to RGB
    clone.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);
      ["color", "backgroundColor", "borderColor"].forEach((prop) => {
        const val = style[prop];
        if (val && val.startsWith("lab")) {
          try {
            el.style[prop] = rgb(lab(val)).toString();
          } catch {
            el.style[prop] = "#000";
          }
        }
      });
    });

    // Render clone for PDF
    const canvas = await html2canvas(clone, { scale: 2 });
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
    <AuthGuard>
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboards")}
                className="text-blue-600 underline"
              >
                ← Back
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
              >
                Export to PDF
              </button>
            </div>
          </div>

          {/* Charts */}
          <div ref={dashboardRef}>
            {charts.length === 0 && (
              <p className="text-gray-500">No charts yet.</p>
            )}

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
                    colors={c.colors} // Safe colors
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
