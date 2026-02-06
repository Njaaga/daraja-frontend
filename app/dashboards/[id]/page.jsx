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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  // ------------------- Fetch Dashboard -------------------
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mappedCharts = (db.dashboard_charts || []).map(dc => {
          const c = dc.chart_detail;
          const chartData = Array.isArray(c.excel_data)
            ? c.excel_data.map(r => (typeof r === "object" ? r : { x: r[0], y: r[1] }))
            : [{ [c.x_field ?? "X"]: c.x_field ?? "A", [c.y_field ?? "Y"]: c.y_field ?? 0 }];

          return {
            key: dc.id,
            title: c.name || c.y_field,
            type: c.chart_type,
            datasetId: c.dataset,
            xField: c.x_field,
            yField: c.y_field,
            excelData: chartData,
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
            stackedFields: c.stacked_fields || [],
            selectedFields: c.selected_fields || null,
          };
        });

        setCharts(mappedCharts);
      } catch {
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  // ------------------- Handle Chart Click -------------------
  const handleChartClick = ({ row }) => {
    if (!row) return;

    setModalRows([row]); // wrap in array for modal
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  // ------------------- Export PDF -------------------
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

  // ------------------- Render -------------------
  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboards")} className="text-sm text-gray-600 hover:underline">← Back</button>
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          </div>
          <button onClick={handleExportPDF} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">Export PDF</button>
        </div>

        {/* Charts */}
        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map(c => (
            <div key={c.key} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <ChartRenderer
                datasetId={c.datasetId}
                type={c.type}
                xField={c.xField}
                yField={c.yField}
                stackedFields={c.stackedFields}
                filters={c.filters}
                excelData={c.excelData}
                logicRules={c.logicRules}
                selectedFields={c.selectedFields}
                onPointClick={handleChartClick}
              />
            </div>
          ))}
        </div>

        {/* Modal */}
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
