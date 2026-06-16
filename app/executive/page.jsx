"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
  }, []);

  async function loadKPIs() {
    try {
      const data = await apiClient("/api/kpis/executive/");

      console.log("Executive KPIs", data);

      setKpis(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalKPIs = kpis.length;

  const healthyCount = kpis.filter(
    (k) => k.status === "healthy"
  ).length;

  const warningCount = kpis.filter(
    (k) => k.status === "warning"
  ).length;

  const criticalCount = kpis.filter(
    (k) => k.status === "critical"
  ).length;

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Executive Dashboard
        </h1>

        <div className="mt-6">
          Loading KPIs...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Executive Dashboard
        </h1>

        <p className="text-gray-500">
          Real-time executive performance metrics
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 mb-8 md:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="text-gray-500">
            Total KPIs
          </div>

          <div className="text-3xl font-bold mt-2">
            {totalKPIs}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="text-gray-500">
            Healthy
          </div>

          <div className="text-3xl font-bold text-green-600 mt-2">
            {healthyCount}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="text-gray-500">
            Warning
          </div>

          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {warningCount}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="text-gray-500">
            Critical
          </div>

          <div className="text-3xl font-bold text-red-600 mt-2">
            {criticalCount}
          </div>
        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {kpis.map((kpi) => {

          const pct =
            kpi.target > 0
              ? Math.round((kpi.current / kpi.target) * 100)
              : 0;

          const statusColor =
            kpi.status === "healthy"
              ? "bg-green-100 text-green-700"
              : kpi.status === "warning"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700";

          return (
            <div
              key={kpi.id}
              className="rounded-xl bg-white p-6 shadow"
            >
              <div className="flex items-center justify-between">

                <h3 className="font-semibold">
                  {kpi.name}
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                >
                  {kpi.status}
                </span>

              </div>

              <div className="mt-6 text-4xl font-bold">
                {Number(kpi.current).toLocaleString()}
              </div>

              <div className="mt-2 text-sm text-gray-500">
                Target: {Number(kpi.target).toLocaleString()}
              </div>

              <div className="mt-4">
                <div className="h-2 rounded bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  {pct}% of target
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Warning: {kpi.warning}
              </div>

              <div className="text-xs text-gray-500">
                Critical: {kpi.critical}
              </div>
            </div>
          );
        })}

      </div>

      {kpis.length === 0 && (
        <div className="mt-10 rounded-xl bg-white p-8 text-center shadow">
          No KPIs found for current tenant
        </div>
      )}

    </div>
  );
}
