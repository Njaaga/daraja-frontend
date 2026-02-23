"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ----------------------------
// SLICER PANEL
// ----------------------------
function SlicerPanel({ fields, filters, onChange, onClear }) {
  if (!fields.length) return null;

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-black"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-xs text-gray-600 mb-1">{field}</label>
            <input
              type="text"
              value={filters[field]?.value || ""}
              onChange={(e) =>
                onChange(field, { type: "text", value: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder={`Filter ${field}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------
// DASHBOARD VIEW
// ----------------------------
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

  // ----------------------------
  // FETCH DASHBOARD + CHART DATA
  // ----------------------------
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const chartPromises = (db.dashboard_charts || []).map(async (dc) => {
          const c = dc.chart_detail;
          let chartData = [];

          // Fetch dataset rows for this chart
          if (c.dataset_id) {
            try {
              const res = await apiClient(
                `/api/datasets/${c.dataset_id}/rows/`
              );
              chartData = res || [];
            } catch (e) {
              console.error("Error fetching dataset rows:", e);
            }
          }

          return {
            key: c.id,
            title: c.name,
            type: c.chart_type,
            xField: c.x_field,
            yField: c.y_field,
            stackedFields: c.stacked_fields || [],
            filters: c.filters || {},
            logicRules: c.logic_rules || [],
            selectedFields: c.selected_fields || null,
            chartData,
          };
        });

        const mappedCharts = await Promise.all(chartPromises);
        setCharts(mappedCharts);
      } catch (e) {
        console.error(e);
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  // ----------------------------
  // AUTO REFRESH EVERY 2 MIN
  // ----------------------------
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 120000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------------
  // SLICER FIELDS
  // ----------------------------
  const slicerFields = useMemo(() => {
    const set = new Set();
    charts.forEach((c) => {
      if (c.xField) set.add(c.xField);
      if (c.yField) set.add(c.yField);
      c.stackedFields.forEach((f) => set.add(f));
    });
    return Array.from(set);
  }, [charts]);

  const handleSlicerChange = (field, rule) =>
    setDashboardFilters((prev) => ({ ...prev, [field]: rule }));
  const clearSlicers = () => setDashboardFilters({});

  // ----------------------------
  // CHART CLICK → DRILLDOWN MODAL
  // ----------------------------
  const handleChartClick = ({ row }) => {
    if (!row) return;
    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  // ----------------------------
  // EXPORT PDF
  // ----------------------------
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

  // ----------------------------
  // APPLY DASHBOARD FILTERS TO CHART DATA
  // ----------------------------
  const filteredCharts = charts.map((c) => {
    let data = c.chartData || [];
    const allFilters = { ...c.filters, ...dashboardFilters };

    Object.entries(allFilters).forEach(([field, rule]) => {
      if (!field || !rule?.value) return;
      data = data.filter((r) => {
        const val = r[field];
        if (val == null) return false;
        return String(val)
          .toLowerCase()
          .includes(String(rule.value).toLowerCase());
      });
    });

    return { ...c, chartData: data };
  });

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
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

          <div className="flex gap-2">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Refresh
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <SlicerPanel
          fields={slicerFields}
          filters={dashboardFilters}
          onChange={handleSlicerChange}
          onClear={clearSlicers}
        />

        {/* Charts */}
        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCharts.map((c) => (
            <div key={`${c.key}-${refreshKey}`} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <ChartRenderer
                chartId={c.key}
                type={c.type}
                xField={c.xField}
                yField={c.yField}
                stackedFields={c.stackedFields}
                selectedFields={c.selectedFields}
                filters={{}} // chartData is already filtered
                excelData={c.chartData}
                onPointClick={handleChartClick}
              />
            </div>
          ))}
        </div>

        {/* Drill-down modal */}
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
