"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadKPIs() {
      try {
        const data = await apiClient("/api/kpis/executive/");

        console.log("EXECUTIVE KPI DATA:", data);

        setKpis(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Executive KPI Error:", err);
        setError(err.message || "Failed to load KPIs");
      } finally {
        setLoading(false);
      }
    }

    loadKPIs();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Executive Dashboard
        </h1>
        <p className="mt-4">Loading KPIs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Executive Dashboard
        </h1>

        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Executive Dashboard
        </h1>

        <p className="text-gray-500">
          Real-time organizational performance
        </p>
      </div>

      <div className="mb-6">
        <strong>KPI Count:</strong> {kpis.length}
      </div>

      {kpis.length === 0 ? (
        <div className="rounded-xl border p-6">
          No KPIs returned from API
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="text-sm text-gray-500">
                {kpi.name}
              </div>

              <div className="mt-3 text-3xl font-bold">
                {Number(kpi.current).toLocaleString()}
              </div>

              <div className="mt-3 text-sm">
                Target: {Number(kpi.target).toLocaleString()}
              </div>

              <div className="text-sm">
                Warning: {Number(kpi.warning).toLocaleString()}
              </div>

              <div className="text-sm">
                Critical: {Number(kpi.critical).toLocaleString()}
              </div>

              <div className="mt-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    kpi.status === "healthy"
                      ? "bg-green-100 text-green-700"
                      : kpi.status === "warning"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {kpi.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
