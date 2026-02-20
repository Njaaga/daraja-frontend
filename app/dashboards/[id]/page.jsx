"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Slicer panel
function SlicerPanel({ fields, filters, onChange, onClear }) {
  if (!fields.length) return null;
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Filters</h3>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-black">
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map(field => (
          <div key={field}>
            <label className="block text-xs text-gray-600 mb-1">{field}</label>
            <input
              type="text"
              value={filters[field]?.value || ""}
              onChange={(e) => onChange(field, { type: "text", value: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder={`Filter ${field}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);
  const [dashboardFilters, setDashboardFilters] = useState({});

  // Fetch dashboard + charts
  useEffect(() => {
    if (!id) return;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mappedCharts = (db.dashboard_charts || []).map(dc => {
          const c = dc.chart_detail;
          return {
            key: c.id,
            title: c.name,
            type: c.chart_type,
            xField: c.x_field,          // ✅ from serializer
            yField: c.y_field,          // ✅ from serializer
            aggregation: c.aggregation || "sum",
            stackedFields: c.stacked_fields || [],
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
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

  // Auto refresh every 2 min
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 120000);
    return () => clearInterval(interval);
  }, []);

  const slicerFields = useMemo(() => {
    const set = new Set();
    charts.forEach(c => c.stackedFields.forEach(f => set.add(f)));
    return Array.from(set);
  }, [charts]);

  const handleSlicerChange = (field, rule) => setDashboardFilters(prev => ({ ...prev, [field]: rule }));
  const clearSlicers = () => setDashboardFilters({});

  const handleChartClick = ({ row }) => {
    if (!row) return;
    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
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

  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboards")} className="text-sm text-gray-600 hover:underline">← Back</button>
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRefreshKey(k => k + 1)} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Refresh</button>
            <button onClick={handleExportPDF} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Export PDF</button>
          </div>
        </div>

        <SlicerPanel
          fields={slicerFields}
          filters={dashboardFilters}
          onChange={handleSlicerChange}
          onClear={clearSlicers}
        />

        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map(c => (
            <div key={`${c.key}-${refreshKey}`} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <ChartRenderer
                chartId={c.key}
                type={c.type}
                stackedFields={c.stackedFields}
                selectedFields={c.selectedFields}
                filters={{ ...c.filters, ...dashboardFilters }}
                xField={c.xField}       // ✅ use serializer fields
                yField={c.yField}       // ✅ use serializer fields
                aggregation={c.aggregation}
                onPointClick={handleChartClick}
              />
            </div>
          ))}
        </div>

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
