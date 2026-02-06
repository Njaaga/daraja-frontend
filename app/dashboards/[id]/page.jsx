"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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

  /* 🔥 Drilldown modal state */
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
          return {
            key: dc.id,
            chartId: dc.chart,
            title: c.name || c.y_field,
            datasetId: c.dataset,
            type: c.chart_type,
            xField: c.x_field,
            yField: c.y_field,
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
            excelData: c.excel_data || null,
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

  /* ===================== CHART CLICK HANDLER ===================== */
  const handleChartClick = ({ field, value, row }) => {
    if (!row) return;

    // 🔥 Filter exact matching rows
    const rows = Array.isArray(row)
      ? row
      : [row];

    setModalRows(rows);
    setModalFields(Object.keys(rows[0] || {}));
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

                <ChartRenderer
                  datasetId={c.datasetId}
                  excelData={c.excelData}
                  type={c.type}
                  xField={c.xField}
                  yField={c.yField}
                  filters={c.filters}
                  logicRules={c.logicRules}
                  selectedFields={c.selectedFields}
                  onPointClick={handleChartClick}   {/* 🔥 THIS WAS MISSING */}
                />
              </div>
            ))}
          </div>
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
