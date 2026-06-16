"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient"; // adjust path

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const data = await apiClient("/api/kpis/");

        console.log("KPIs:", data);

        setKpis(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadKPIs();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Executive Dashboard
      </h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-xl border p-6"
          >
            <h3>{kpi.name}</h3>

            <div>
              Target: {kpi.target_value}
            </div>

            <div>
              Warning: {kpi.warning_threshold}
            </div>

            <div>
              Critical: {kpi.critical_threshold}
            </div>

            <div>
              {kpi.active ? "Active" : "Inactive"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
