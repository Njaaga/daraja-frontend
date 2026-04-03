"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import DashboardSlicers from "@/app/components/DashboardSlicers";
import { apiClient } from "@/lib/apiClient";

import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(GridLayout);

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [layout, setLayout] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [slicers, setSlicers] = useState({
    date_field: "",
    from: "",
    to: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  // ----------------------------
  // BUILD GRID LAYOUT FROM BACKEND (PER-CHART)
  // ----------------------------
  const buildLayoutFromCharts = (charts) => {
    return charts.map((chart) => ({
      i: chart.id.toString(), // REQUIRED by react-grid-layout
      x: chart.layout?.x ?? 0,
      y: chart.layout?.y ?? 0,
      w: chart.layout?.w ?? 6,
      h: chart.layout?.h ?? 3,
    }));
  };

  // ----------------------------
  // LOAD DASHBOARD
  // ----------------------------
  const loadDashboard = async () => {
    try {
      const res = await apiClient(`/api/dashboards/${id}/run/`);

      setDashboard({ id: res.id, name: res.name });
      setCharts(res.charts || []);

      // 👇 build layout from chart.layout
      const builtLayout = buildLayoutFromCharts(res.charts || []);
      setLayout(builtLayout);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard.");
    }
  };

  useEffect(() => {
    if (id) loadDashboard();
  }, [id]);

  // ----------------------------
  // REFRESH DATA (KEEP LAYOUT)
  // ----------------------------
  const refreshDashboard = async () => {
    if (!id || refreshing) return;

    try {
      setRefreshing(true);
      setError("");

      const query = new URLSearchParams(
        Object.entries(slicers).filter(([, v]) => v)
      ).toString();

      const res = await apiClient(
        `/api/dashboards/${id}/run/${query ? `?${query}` : ""}`
      );

      setDashboard((prev) => prev || { id: res.id, name: res.name });
      setCharts(res.charts || []);

      // ⚠️ DO NOT overwrite layout here (user may be editing)
    } catch (err) {
      console.error(err);
      setError("Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  };

  // ----------------------------
  // SAVE LAYOUT
  // ----------------------------
const saveLayout = async () => {
  try {
    await apiClient(`/api/dashboards/${id}/layout/`, {
      method: "POST",
      body: JSON.stringify(layout),   // ✅ send raw array
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Failed to save layout", err);
  }
};

  // ----------------------------
  // SLICERS
  // ----------------------------
  const updateSlicer = (key, value) =>
    setSlicers((prev) => ({ ...prev, [key]: value }));

  const clearSlicers = () =>
    setSlicers({ date_field: "", from: "", to: "" });

  // ----------------------------
  // CHART CLICK
  // ----------------------------
  const handleChartClick = ({ row }) => {
    if (!row) return;
    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <Layout>
      <div className="p-6 w-full">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboards")}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold">
              {dashboard?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              {editMode ? "Exit Edit" : "Edit Layout"}
            </button>

            <button
              onClick={saveLayout}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Save
            </button>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* SLICERS */}
        <DashboardSlicers
          slicers={slicers}
          onChange={updateSlicer}
          onClear={clearSlicers}
        />

        {/* GRID */}
        <div ref={dashboardRef} className="mt-6 relative w-full">
          {refreshing && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
              <span className="text-gray-500 text-sm">
                Updating charts…
              </span>
            </div>
          )}

          {charts.length === 0 && !refreshing && (
            <div className="text-center text-gray-400">
              Click <strong>Refresh</strong> to load data
            </div>
          )}

          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={100}
            width={1200}
            isDraggable={editMode}
            isResizable={editMode}
            draggableHandle=".drag-handle"
            onLayoutChange={(newLayout) => setLayout(newLayout)}
          >
            {charts.map((chart) => (
              <div
                key={chart.id.toString()}
                className="bg-white p-4 rounded shadow h-full flex flex-col"
              >
                {/* DRAG HANDLE */}
                <div className="drag-handle cursor-move font-semibold mb-2">
                  {chart.name}
                </div>

                {/* CHART */}
                <div className="flex-1 min-h-0">
                  <ChartRenderer
                    type={chart.type}
                    xField={chart.xField}
                    yField={chart.yField}
                    stackedFields={chart.stackedFields}
                    filters={chart.filters}
                    selectedFields={chart.selectedFields}
                    excelData={chart.data}
                    onPointClick={handleChartClick}
                  />
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>

        {/* MODAL */}
        <ChartDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          rows={modalRows}
          selectedFields={modalFields}
        />

        {/* ERROR */}
        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}
      </div>
    </Layout>
  );
}
