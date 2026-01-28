"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import AuthGuard from "@/app/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { lab, rgb } from "d3-color";

/**
 * Convert CSS lab() colors → hex (html2canvas does NOT support lab())
 */
function sanitizeColor(color) {
  if (!color || typeof color !== "string") return color;

  if (color.startsWith("lab(")) {
    try {
      return rgb(lab(color)).formatHex();
    } catch {
      return "#000000";
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

  const chartRefs = useRef({});

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

        const mapped =
          db.dashboard_charts?.map((dc) => {
            const d = dc.chart_detail || {};

            const colors = Array.isArray(d.colors)
              ? d.colors.map(sanitizeColor)
              : [];

            return {
              key: String(dc.id),
              chartId: dc.chart,
              title: d.name || d.label || d.y_field || "Chart",
              datasetId: d.dataset,
              type: d.chart_type,
              xField: d.x_field,
              yField: d.y_field,
              aggregation: d.aggregation,
              filters: d.filters || {},
              logicRules: d.logic_rules || [],
              logicExpression: d.logic_expression || null,
              joins: d.joins || [],
              excelData: d.excel_data || null,
              colors,
            };
          }) || [];

        setCharts(mapped);
      } catch (err) {
        console.error(err);
        setError(
          err?.status === 403
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
  // Export PDF (NO iframes, NO lab())
  // -----------------------------
const handleExportPDF = async () => {
  if (!charts.length) {
    alert("No charts to export.");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 10;

  for (const c of charts) {
    const source = chartRefs.current[c.key];
    if (!source) continue;

    // 🔥 CLONE NODE (do NOT use live DOM)
    const clone = source.cloneNode(true);

    // 🔥 FORCE SAFE COLORS
    clone.style.background = "#ffffff";
    clone.style.color = "#000000";

    // 🔥 REMOVE ALL INLINE STYLES THAT MAY CONTAIN lab()
    clone.querySelectorAll("*").forEach((el) => {
      el.style.color = "#000000";
      el.style.backgroundColor = "#ffffff";
      el.style.borderColor = "#cccccc";
      el.style.boxShadow = "none";
    });

    // Attach offscreen
    clone.style.position = "fixed";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        foreignObjectRendering: false,
        useCORS: true,
        ignoreElements: (el) => el.tagName === "IFRAME",
      });

      const img = canvas.toDataURL("image/png");
      const props = pdf.getImageProperties(img);

      const width = pageWidth - 20;
      const height = (props.height * width) / props.width;

      if (y + height > pageHeight) {
        pdf.addPage();
        y = 10;
      }

      pdf.addImage(img, "PNG", 10, y, width, height);
      y += height + 10;
    } finally {
      document.body.removeChild(clone);
    }
  }

  pdf.save(`${dashboard?.name || "dashboard"}.pdf`);
};


  // -----------------------------
  // Render states
  // -----------------------------
  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <AuthGuard>
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{dashboard?.name}</h2>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboards")}
                className="text-blue-600 underline"
              >
                ← Back
              </button>

              <button
                onClick={handleExportPDF}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
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
                key={c.key}
                ref={(el) => (chartRefs.current[c.key] = el)}
                className="bg-white p-4 rounded shadow"
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
                  aggregation={c.aggregation}
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
