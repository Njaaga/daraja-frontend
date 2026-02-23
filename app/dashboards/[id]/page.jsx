"use client";

import { useEffect, useState, useRef } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Dashboard-level slicers
  const [slicers, setSlicers] = useState({
    date_field: "",
    from: "",
    to: "",
  });

  // 🔹 Drilldown modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  // ----------------------------
  // LOAD DASHBOARD (QB LIVE)
  // ----------------------------
  const loadDashboard = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams(
        Object.entries(slicers).filter(([, v]) => v)
      ).toString();

      const res = await apiClient(
        `/api/dashboards/${id}/run/${query ? `?${query}` : ""}`
      );

      setDashboard({ id: res.id, name: res.name });
      setCharts(res.charts || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load QuickBooks dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + slicer changes
  useEffect(() => {
    loadDashboard();
  }, [id, slicers]);

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
  // CHART CLICK (DRILLDOWN)
  // ----------------------------
  const handleChartClick = ({ row }) => {
    if (!row) return;
    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  // ----------------------------
  // RENDER STATES
  // ----------------------------
  if (loading) {
    return <p className="p-6">Loading QuickBooks dashboard…</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!dashboard) {
    return <p className="p-6">Dashboard not found.</p>;
  }

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

          <button
            onClick={loadDashboard}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>

        {/* Dashboard Slicers */}
        <DashboardSlicers
          slicers={slicers}
          onChange={updateSlicer}
          onClear={clearSlicers}
        />

        {/* Charts */}
        <div
          ref={dashboardRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
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

        {/* Drilldown Modal */}
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
