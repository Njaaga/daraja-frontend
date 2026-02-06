"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import BarChart from "@/app/components/ChartRenderer";
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  /* ===================== FETCH DASHBOARD ===================== */
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mappedCharts = (db.dashboard_charts || []).map((dc) => {
          const c = dc.chart_detail;

          // Ensure excelData is array of objects
          const chartData = Array.isArray(c.excel_data)
            ? c.excel_data.map((r) => (typeof r === "object" ? r : { x: r[0], y: r[1] }))
            : [{ x: c.x_field ?? "A", y: c.y_field ?? 0 }];

          return {
            key: dc.id,
            chartId: dc.chart,
            title: c.name || c.y_field,
            type: c.chart_type,
            datasetId: c.dataset,
            xField: c.x_field,
            yField: c.y_field,
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
            excelData: chartData,
            selectedFields: c.selected_fields || null,
          };
        });

        setCharts(mappedCharts);
      } catch (err) {
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  /* ===================== CHART CLICK ===================== */
  const handleChartClick = ({ field, value, row }) => {
    console.log("Clicked row:", row);
    if (!row) return;

    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  /* ===================== PDF EXPORT ===================== */
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
  if (loading) return <p className="p-6">Loading dashboard…</p>;
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
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition"
          >
            Export PDF
          </button>
        </div>

        {/* DASHBOARD CONTENT */}
        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <div key={c.key} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>

              <BarChart data={c.excelData} onBarClick={handleChartClick} />
            </div>
          ))}
        </div>

        {/* 🔥 MODAL */}
        <ChartDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          rows={modalRows}
          selectedFields={modalFields}
        />
      </div>
    </Layout>
  );
}
