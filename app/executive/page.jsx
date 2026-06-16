"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutiveData();
  }, []);

  async function loadExecutiveData() {
    try {
      const data = await apiClient("/api/kpis/executive/");

      setKpis(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading Executive Dashboard...
      </div>
    );
  }

  const healthy = kpis.filter(
    (x) => x.status === "healthy"
  ).length;

  const warning = kpis.filter(
    (x) => x.status === "warning"
  ).length;

  const critical = kpis.filter(
    (x) => x.status === "critical"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      {/* PAGE HEADER */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Executive Command Center
        </h1>

        <p className="text-gray-500">
          Real-time business intelligence platform
        </p>
      </div>

      {/* EXECUTIVE SUMMARY */}

      <div className="mb-8 grid gap-6 md:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Active KPIs
          </div>

          <div className="mt-3 text-4xl font-bold">
            {kpis.length}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Healthy
          </div>

          <div className="mt-3 text-4xl font-bold text-green-600">
            {healthy}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Warning
          </div>

          <div className="mt-3 text-4xl font-bold text-yellow-600">
            {warning}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Critical
          </div>

          <div className="mt-3 text-4xl font-bold text-red-600">
            {critical}
          </div>
        </div>

      </div>

      {/* KPI SCORECARDS */}

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          KPI Scorecards
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {kpis.map((kpi) => {

            const pct =
              kpi.target > 0
                ? Math.round(
                    (kpi.current / kpi.target) * 100
                  )
                : 0;

            const statusClass =
              kpi.status === "healthy"
                ? "bg-green-100 text-green-700"
                : kpi.status === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700";

            return (
              <div
                key={kpi.id}
                className="rounded-2xl bg-white p-6 shadow"
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold">
                    {kpi.name}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${statusClass}`}
                  >
                    {kpi.status}
                  </span>
                </div>

                <div className="mt-6 text-4xl font-bold">
                  {Number(
                    kpi.current || 0
                  ).toLocaleString()}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Target:{" "}
                  {Number(
                    kpi.target || 0
                  ).toLocaleString()}
                </div>

                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          pct,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    {pct}% of target
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* TRENDING SECTION */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Revenue Trend
          </h3>

          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-gray-400">
            Revenue Chart
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Profit Trend
          </h3>

          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-gray-400">
            Profit Chart
          </div>
        </div>

      </div>

      {/* ALERTS */}

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">

        <h3 className="mb-4 text-lg font-semibold">
          Executive Alerts
        </h3>

        {critical === 0 ? (
          <div className="text-green-600">
            No critical KPI alerts.
          </div>
        ) : (
          <div className="text-red-600">
            {critical} KPI(s) require attention.
          </div>
        )}

      </div>

    </div>
  );
}
