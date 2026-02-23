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
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-black">Clear all</button>
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

// ----------------------------
// AGGREGATION UTILS
// ----------------------------
function aggregateData(rows, xField, yField, aggregation) {
  if (!aggregation || aggregation === "none") return rows;

  const map = {};
  for (const row of rows) {
    const x = row[xField];
    const rawY = row[yField];
    if (x == null) continue;

    if (!map[x]) map[x] = { x, values: [] };

    if (aggregation === "count") {
      map[x].values.push(1);
      continue;
    }

    const y = Number(rawY);
    if (!isNaN(y)) map[x].values.push(y);
  }

  return Object.values(map).map(({ x, values }) => {
    let y = 0;
    switch (aggregation) {
      case "sum": y = values.reduce((a, b) => a + b, 0); break;
      case "avg": y = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
      case "count": y = values.length; break;
    }
    return { [xField]: x, [yField]: y };
  });
}

// ----------------------------
// FILTER + LOGIC APPLY
// ----------------------------
function applyFilters(rows, filters) {
  let data = [...rows];
  Object.entries(filters).forEach(([field, rule]) => {
    if (!field || !rule?.value) return;
    data = data.filter(row => {
      const val = row[field];
      if (val == null) return false;
      return String(val).toLowerCase().includes(String(rule.value).toLowerCase());
    });
  });
  return data;
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
  // FETCH DASHBOARD
  // ----------------------------
  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        // map charts and include saved rows if available
        const mappedCharts = (db.dashboard_charts || []).map(dc => {
          const c = dc.chart_detail;
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
            aggregation: c.aggregation || "none",
            chartData: dc.rows || [], // saved rows for chart
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

  // ----------------------------
  // AUTO REFRESH
  // ----------------------------
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 120000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------------
  // SLICER FIELDS
  // ----------------------------
  const slicerFields = useMemo(() => {
    const set = new Set();
    charts.forEach(c => {
      if (c.xField) set.add(c.xField);
      if (c.yField) set.add(c.yField);
      c.stackedFields.forEach(f => set.add(f));
    });
    return Array.from(set);
  }, [charts]);

  const handleSlicerChange = (field, rule) => setDashboardFilters(prev => ({ ...prev, [field]: rule }));
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

  // ----------------------------
  // APPLY FILTERS + AGGREGATION TO CHARTS
  // ----------------------------
  const displayedCharts = useMemo(() => {
    return charts.map(c => {
      let data = c.chartData || [];
      // Apply slicer + chart-level filters
      data = applyFilters(data, { ...c.filters, ...dashboardFilters });
      // Apply aggregation if needed
      const aggregatedData = c.type !== "table" && c.xField && c.yField
        ? aggregateData(data, c.xField, c.yField, c.aggregation)
        : data;
      return { ...c, chartData: aggregatedData };
    });
  }, [charts, dashboardFilters, refreshKey]);

  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
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

        {/* Filters */}
        <SlicerPanel
          fields={slicerFields}
          filters={dashboardFilters}
          onChange={handleSlicerChange}
          onClear={clearSlicers}
        />

        {/* Charts */}
        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedCharts.map(c => (
            <div key={`${c.key}-${refreshKey}`} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <ChartRenderer
                chartId={c.key}
                type={c.type}
                xField={c.xField}
                yField={c.yField}
                stackedFields={c.stackedFields}
                selectedFields={c.selectedFields}
                filters={{}}
                excelData={c.chartData}   // ✅ send actual rows
                aggregation={c.aggregation || "none"}
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
