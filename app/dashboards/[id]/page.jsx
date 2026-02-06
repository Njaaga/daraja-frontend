"use client";

import { useState, useMemo } from "react";
import "@/lib/chartjs";
import { Bar, Doughnut } from "react-chartjs-2";
import ChartDetailsModal from "./ChartDetailsModal";

/* ---------------- UTIL ---------------- */
const normalize = (v) => String(v ?? "").trim();

/* ---------------- DASHBOARD ---------------- */
export default function DashboardView({ rows }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  /* ---------------- CONFIG ---------------- */
  const X_FIELD = "status";      // category
  const Y_FIELD = "amount";      // numeric
  const TABLE_FIELDS = ["id", "status", "customer", "amount", "date"];

  /* ---------------- AGGREGATE ---------------- */
  const aggregated = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const x = normalize(r[X_FIELD]);
      const y = Number(r[Y_FIELD]);
      if (!x || isNaN(y)) return;
      map[x] = (map[x] || 0) + y;
    });

    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
    }));
  }, [rows]);

  /* ---------------- SLICE HANDLER ---------------- */
  const handleSliceClick = (label) => {
    const filtered = rows.filter(
      (r) => normalize(r[X_FIELD]) === normalize(label)
    );

    setModalRows(filtered);
    setSelectedFields(TABLE_FIELDS);
    setModalOpen(true);
  };

  /* ---------------- BAR CHART ---------------- */
  const barData = {
    labels: aggregated.map((d) => d.label),
    datasets: [
      {
        label: "Total Amount",
        data: aggregated.map((d) => d.value),
      },
    ],
  };

  const barOptions = {
    responsive: true,
    onClick: (_, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      handleSliceClick(barData.labels[index]);
    },
  };

  /* ---------------- PIE CHART ---------------- */
  const pieData = {
    labels: aggregated.map((d) => d.label),
    datasets: [
      {
        data: aggregated.map((d) => d.value),
        backgroundColor: [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    onClick: (_, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      handleSliceClick(pieData.labels[index]);
    },
  };

  /* ---------------- VIEW ---------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4 h-[350px]">
          <h3 className="font-semibold mb-2">Bar Chart</h3>
          <Bar data={barData} options={barOptions} />
        </div>

        <div className="border rounded p-4 h-[350px]">
          <h3 className="font-semibold mb-2">Pie Chart</h3>
          <Doughnut data={pieData} options={pieOptions} />
        </div>
      </div>

      {/* Modal */}
      <ChartDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rows={modalRows}
        selectedFields={selectedFields}
      />
    </div>
  );
}
