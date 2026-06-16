"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadKPIs();
  }, []);

  async function loadKPIs() {
    try {
      const data = await apiClient("/api/kpis/");

      console.log("KPI RESPONSE:", data);

      const rows = Array.isArray(data)
        ? data
        : data?.results || [];

      setKpis(rows);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading KPIs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Executive Dashboard
        </h1>

        <p className="text-gray-500">
          KPI Monitoring
        </p>
      </div>

      <div className="mb-6">
        <strong>Total KPIs:</strong> {kpis.length}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-xl bg-white p-6 shadow"
          >
            <h3 className="font-semibold text-lg">
              {kpi.name}
            </h3>

            <div className="mt-4 space-y-2">

              <div>
                <span className="text-gray-500">
                  Target:
                </span>{" "}
                {Number(
                  kpi.target_value || 0
                ).toLocaleString()}
              </div>

              <div>
                <span className="text-gray-500">
                  Warning:
                </span>{" "}
                {Number(
                  kpi.warning_threshold || 0
                ).toLocaleString()}
              </div>

              <div>
                <span className="text-gray-500">
                  Critical:
                </span>{" "}
                {Number(
                  kpi.critical_threshold || 0
                ).toLocaleString()}
              </div>

              <div>
                <span className="text-gray-500">
                  Metric:
                </span>{" "}
                {kpi.metric_id}
              </div>

              <div>
                <span className="text-gray-500">
                  Tenant:
                </span>{" "}
                {kpi.tenant_id}
              </div>

              <div className="pt-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    kpi.active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {kpi.active ? "Active" : "Inactive"}
                </span>
              </div>

            </div>
          </div>
        ))}

      </div>

      {kpis.length === 0 && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          No KPI records returned from API.
        </div>
      )}
    </div>
  );
}
