"use client";

import { useEffect, useState, useRef } from "react";
import AuthGuard from "@/app/components/AuthGuard";
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

  const dashboardRef = useRef(); // ← capture dashboard DOM

  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const db = await apiClient(`/api/dashboards/${id}/`);

        setDashboard(db);

        if (db.dashboard_charts) {
          const mappedCharts = db.dashboard_charts.map((dc) => {
            const chartDetail = dc.chart_detail;
            return {
              i: dc.id.toString(),
              chartId: dc.chart,
              
              title: dc.chart_detail.name,
              dataset: dc.chart_detail.dataset,
              type: dc.chart_detail.chart_type,
              xField: dc.chart_detail.x_field,
              yField: dc.chart_detail.y_field,
              aggregation: dc.chart_detail.aggregation,

              // 🔥 REQUIRED
              filters: dc.chart_detail.filters || {},
              logicRules: dc.chart_detail.logic_rules || [],
              logicExpression: dc.chart_detail.logic_expression || null,
              joins: dc.chart_detail.joins || [],
              excelData: dc.chart_detail.excel_data || null,

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


  const handleDeleteChart = async (chartId) => {
    if (!confirm("Delete this chart? This cannot be undone.")) return;
  
    try {
      await apiClient.delete(`/api/charts/${chartId}/`);
  
      // remove from UI immediately
      setCharts((prev) =>
        prev.filter((c) => c.chartId !== chartId)
      );
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          <div className="flex gap-4">
            <button
              className="text-blue-600 underline"
              onClick={() => router.push("/dashboards")}
            >
              ← Back
            </button>
            <button
              className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
              onClick={handleExportPDF}
            >
              Export to PDF
            </button>
          </div>
        </div>

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
