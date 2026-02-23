"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import DashboardSlicers from "@/app/components/DashboardSlicers";
import { apiClient } from "@/lib/apiClient";

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Dashboard slicers (NO auto fetch)
  const [slicers, setSlicers] = useState({
    date_field: "",
    from: "",
    to: "",
  });

  // Drilldown modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  // ----------------------------
  // IN-PLACE DASHBOARD REFRESH
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

      // 🔹 Replace data ONLY
      setDashboard(prev => prev || { id: res.id, name: res.name });
      setCharts(res.charts || []);
    } catch (err) {
      console.error(err);
      setError("Failed to refresh QuickBooks data.");
    } finally {
      setRefreshing(false);
    }
  };

  // ----------------------------
  // SLICER HANDLERS
  // ----------------------------
  const updateSlicer = (key, value) =>
    setSlicers(prev => ({ ...prev, [key]: value }));

  const clearSlicers = () =>
    setSlicers({
      date_field: "",
      from: "",
      to: "",
    });

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
      <div className="p-6">
        {/* Header never disappears */}
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

          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Slicers */}
        <DashboardSlicers
          slicers={slicers}
          onChange={updateSlicer}
          onClear={clearSlicers}
        />

        {/* Charts container NEVER unmounts */}
        <div
          ref={dashboardRef}
          className="relative grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
        >
          {/* Subtle overlay */}
          {refreshing && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
              <span className="text-gray-500 text-sm">
                Updating charts…
              </span>
            </div>
          )}

          {charts.length === 0 && !refreshing && (
            <div className="col-span-full text-center text-gray-400">
              Click <strong>Refresh</strong> to load QuickBooks data
            </div>
          )}

          {charts.map(chart => (
            <div
              key={chart.id}
              className="bg-white p-4 rounded shadow"
            >
              <h3 className="font-semibold mb-2">{chart.name}</h3>

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
          ))}
        </div>

        {/* Drilldown */}
        <ChartDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          rows={modalRows}
          selectedFields={modalFields}
        />

        {/* Error */}
        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}
      </div>
    </Layout>
  );
}
