"use client";

import { useEffect, useState, useRef } from "react";
import Layout from "@/app/components/Layout";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingChartId, setEditingChartId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        if (db.dashboard_charts) {
          setCharts(
            db.dashboard_charts.map((dc) => {
              const cd = dc.chart_detail;
              return {
                i: dc.id.toString(),
                chartId: dc.chart,
                title: cd.name || cd.y_field,
                datasetId: cd.dataset,
                type: cd.chart_type,
                xField: cd.x_field,
                yField: cd.y_field,
                aggregation: cd.aggregation,
                filters: cd.filters || {},
                logicRules: cd.logic_rules || [],
                logicExpression: cd.logic_expression || null,
                joins: cd.joins || [],
                excelData: cd.excel_data || null,
              };
            })
          );
        }
      } catch {
        setError("Dashboard not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  const handleDeleteChart = async (chartId) => {
    if (!confirm("Delete this chart?")) return;

    try {
      await apiClient(`/api/charts/${chartId}/`, { method: "DELETE" });
      setCharts((prev) => prev.filter((c) => c.chartId !== chartId));
    } catch {
      alert("Failed to delete chart");
    }
  };

  const startRename = (chart) => {
    setEditingChartId(chart.chartId);
    setTempTitle(chart.title);
  };

  const cancelRename = () => {
    setEditingChartId(null);
    setTempTitle("");
  };

  const saveRename = async (chart) => {
    if (!tempTitle.trim()) return cancelRename();

    try {
      await apiClient(`/api/charts/${chart.chartId}/`, {
        method: "PATCH",
        body: JSON.stringify({ name: tempTitle.trim() }),
      });

      setCharts((prev) =>
        prev.map((c) =>
          c.chartId === chart.chartId ? { ...c, title: tempTitle.trim() } : c
        )
      );
    } catch {
      alert("Failed to rename chart");
    } finally {
      cancelRename();
    }
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{dashboard.name}</h2>
        </div>

        <div ref={dashboardRef}>
          {charts.length === 0 && <p>No charts yet.</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((c) => (
              <div key={c.i} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-2 gap-2">
                  {editingChartId === c.chartId ? (
                    <input
                      autoFocus
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={() => saveRename(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(c);
                        if (e.key === "Escape") cancelRename();
                      }}
                      className="border px-2 py-1 rounded w-full text-sm"
                    />
                  ) : (
                    <h3
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => startRename(c)}
                      title="Click to rename"
                    >
                      {c.title}
                    </h3>
                  )}

                  <button
                    onClick={() => handleDeleteChart(c.chartId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>

                <ChartRenderer
                  datasetId={c.datasetId}
                  excelData={c.excelData}
                  type={c.type}
                  xField={c.xField}
                  yField={c.yField}
                  filters={c.filters}
                  logicRules={c.logicRules}
                  logicExpression={c.logicExpression}
                  joins={c.joins}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
