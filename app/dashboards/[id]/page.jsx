"use client";

import { useEffect, useState, useRef } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import jsPDF from "jspdf";
import { lab, rgb } from "d3-color";
import html2canvas from "html2canvas";

/**
 * Convert any "lab(...)" color strings to hex
 */
function sanitizeColor(color) {
  if (!color || typeof color !== "string") return color;
  if (color.startsWith("lab(")) {
    try {
      return rgb(lab(color)).formatHex(); // convert lab() → hex
    } catch (e) {
      console.warn("Failed to parse LAB color:", color);
      return "#000"; // fallback
    }
  }
  return color;
}

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chartRefs = useRef({}); // store refs to each chart container

  // -----------------------------
  // Fetch dashboard
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

            // sanitize all colors in chartDetail
            if (chartDetail.colors && Array.isArray(chartDetail.colors)) {
              chartDetail.colors = chartDetail.colors.map(sanitizeColor);
            }

            return {
              i: dc.id.toString(),
              chartId: dc.chart,
              title:
                chartDetail.name ||
                chartDetail.label ||
                chartDetail.y_field,
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
              colors: chartDetail.colors || [],
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
  // Export PDF
  // -----------------------------
  const handleExportPDF = async () => {
    if (!charts.length) return alert("No charts to export.");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yOffset = 10;

    for (let i = 0; i < charts.length; i++) {
      const c = charts[i];
      const chartContainer = chartRefs.current[c.i];
      if (!chartContainer) continue;

      // Render chart container as canvas
      const canvas = await html2canvas(chartContainer, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (yOffset + pdfHeight > pageHeight) {
        pdf.addPage();
        yOffset = 10;
      }

      pdf.addImage(imgData, "PNG", 10, yOffset, pdfWidth, pdfHeight);
      yOffset += pdfHeight + 10;
    }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.length === 0 && (
              <p className="text-gray-500">No charts yet.</p>
            )}

            {charts.map((c) => (
              <div
                key={c.i}
                className="bg-white p-4 rounded shadow"
                ref={(el) => (chartRefs.current[c.i] = el)}
              >
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
                  colors={c.colors}
                />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
