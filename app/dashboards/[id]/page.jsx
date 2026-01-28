"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { lab, rgb } from "d3-color";

/* -----------------------------------------------------
   Helpers
----------------------------------------------------- */

function sanitizeColor(color?: string) {
  if (!color || typeof color !== "string") return color;

  if (color.startsWith("lab(")) {
    try {
      return rgb(lab(color)).formatHex(); // lab() → hex
    } catch {
      return "#000000";
    }
  }

  return color;
}

/* -----------------------------------------------------
   Component
----------------------------------------------------- */

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<any>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* -----------------------------------------------------
     Fetch dashboard
  ----------------------------------------------------- */
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const db = await apiClient(`/api/dashboards/${id}/`);

        if (!mounted) return;

        setDashboard(db);

        const mapped =
          db?.dashboard_charts?.map((dc) => {
            const d = dc.chart_detail || {};

            return {
              key: dc.id.toString(),
              chartId: dc.chart,
              title: d.name || d.label || d.y_field || "Untitled chart",
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
              colors: Array.isArray(d.colors)
                ? d.colors.map(sanitizeColor)
                : [],
            };
          }) || [];

        setCharts(mapped);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.status === 403
            ? "You do not have permission to view this dashboard."
            : "Dashboard not found."
        );
      } finally {
        mounted && setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [id]);

  /* -----------------------------------------------------
     Delete chart
  ----------------------------------------------------- */
  const handleDeleteChart = async (chartId: number) => {
    if (!confirm("Delete this chart?")) return;

    try {
      await apiClient(`/api/charts/${chartId}/`, { method: "DELETE" });
      setCharts((prev) => prev.filter((c) => c.chartId !== chartId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete chart");
    }
  };

  /* -----------------------------------------------------
     Export PDF
  ----------------------------------------------------- */
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
      const el = chartRefs.current[c.key];
      if (!el) continue;

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const img = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (y + imgHeight > pageHeight) {
        pdf.addPage();
        y = 10;
      }

      pdf.addImage(img, "PNG", 10, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    }

    pdf.save(`${dashboard?.name || "dashboard"}.pdf`);
  };

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

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
          {charts.length === 0 ? (
            <p className="text-gray-500">No charts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    filters={c.filters}
                    logicRules={c.logicRules}
                    logicExpression={c.logicExpression}
                    joins={c.joins}
                    colors={c.colors}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
