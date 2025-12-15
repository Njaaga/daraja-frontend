"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import Link from "next/link";

export default function DashboardView({ params }) {
  const { id } = params; // dashboard ID from URL
  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [kpiValues, setKpiValues] = useState({}); // for KPI charts

  useEffect(() => {
    if (!id) return;

    apiClient(`/api/dashboards/${id}/`).then((res) => {
      setDashboard(res);

      if (res.dashboard_charts) {
        const mappedCharts = res.dashboard_charts.map((dc, i) => ({
          i: dc.id.toString(),
          chartId: dc.chart,
          dataset: dc.chart_detail.dataset,
          type: dc.chart_detail.chart_type,
          xField: dc.chart_detail.x_field,
          yField: dc.chart_detail.y_field,
          aggregation: dc.chart_detail.aggregation,
        }));

        setCharts(mappedCharts);

        // Fetch KPI values
        mappedCharts.forEach((c) => {
          if (c.type === "kpi") {
            apiClient(`/api/datasets/${c.dataset}/aggregate/`, {
              method: "POST",
              body: JSON.stringify({ field: c.yField, aggregation: c.aggregation }),
            })
              .then((res) => {
                const value = res.value ?? res.data?.value ?? 0;
                setKpiValues((prev) => ({ ...prev, [c.i]: value }));
              })
              .catch(() => {
                setKpiValues((prev) => ({ ...prev, [c.i]: 0 }));
              });
          }
        });
      }
    });
  }, [id]);

  if (!dashboard) return <p>Loading dashboard...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
        </div>
        <Link href="/dashboards" className="text-blue-600 underline">
          ← Back to Dashboards
        </Link>
      </div>

      {charts.length === 0 ? (
        <p>No charts added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {charts.map((c) => (
            <div
              key={c.i}
              className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center"
            >
              {c.type === "kpi" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">{c.yField.toUpperCase()}</h3>
                  <p className="text-3xl font-bold">{kpiValues[c.i] ?? "..."}</p>
                </>
              ) : (
                <ChartRenderer
                  datasetId={c.dataset}
                  type={c.type}
                  xField={c.xField}
                  yField={c.yField}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
