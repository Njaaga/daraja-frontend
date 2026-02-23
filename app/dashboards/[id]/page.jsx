"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import { apiClient } from "@/lib/apiClient";

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

  // ----------------------------
  // LOAD QB DASHBOARD (LIVE)
  // ----------------------------
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient(`/api/dashboards/${id}/run/`);

        setDashboard({ id: res.id, name: res.name });
        setCharts(res.charts);
      } catch (e) {
        console.error(e);
        setError("Unable to load QuickBooks dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const onChartClick = ({ row }) => {
    if (!row) return;
    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  if (loading) return <p className="p-6">Loading QuickBooks data…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboards")}>← Back</button>
          <h2 className="text-2xl font-bold">{dashboard.name}</h2>
        </div>

        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map(c => (
            <div key={c.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.name}</h3>
              <ChartRenderer
                type={c.type}
                xField={c.xField}
                yField={c.yField}
                stackedFields={c.stackedFields}
                filters={c.filters}
                selectedFields={c.selectedFields}
                excelData={c.data}
                onPointClick={onChartClick}
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
