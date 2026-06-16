"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      import { getExecutiveDashboard }
      from "@/services/executiveService";
      
      const data = await getExecutiveDashboard();

      const transformed = data.map((kpi) => ({
        id: kpi.id,
        name: kpi.name,
        current: Math.round(Number(kpi.target_value) * 0.85),
        target: Number(kpi.target_value),
        warning: Number(kpi.warning_threshold),
        critical: Number(kpi.critical_threshold),
      }));

      setKpis(transformed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const healthy = kpis.filter(
    (k) => k.current >= k.warning
  ).length;

  const warning = kpis.filter(
    (k) =>
      k.current < k.warning &&
      k.current >= k.critical
  ).length;

  const critical = kpis.filter(
    (k) => k.current < k.critical
  ).length;

  if (loading) {
    return (
      <div className="p-8">
        Loading Executive Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      {/* HEADER */}

      <div className="mb-10">
        <h1 className="text-5xl font-bold">
          Executive Command Center
        </h1>

        <p className="text-gray-500 text-lg mt-2">
          Enterprise Business Intelligence Platform
        </p>
      </div>

      {/* EXECUTIVE KPIs */}

      <div className="grid gap-6 md:grid-cols-4 mb-10">

        <SummaryCard
          title="Active KPIs"
          value={kpis.length}
        />

        <SummaryCard
          title="Healthy"
          value={healthy}
          valueClass="text-green-600"
        />

        <SummaryCard
          title="Warning"
          value={warning}
          valueClass="text-yellow-600"
        />

        <SummaryCard
          title="Critical"
          value={critical}
          valueClass="text-red-600"
        />

      </div>

      {/* KPI SCORECARDS */}

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-5">
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

            const status =
              kpi.current >= kpi.warning
                ? "healthy"
                : kpi.current >= kpi.critical
                ? "warning"
                : "critical";

            return (
              <div
                key={kpi.id}
                className="rounded-2xl bg-white p-6 shadow"
              >
                <div className="flex justify-between items-center">

                  <h3 className="font-semibold text-lg">
                    {kpi.name}
                  </h3>

                  <StatusDot status={status} />

                </div>

                <div className="mt-6 text-5xl font-bold">
                  {kpi.current.toLocaleString()}
                </div>

                <div className="mt-2 text-gray-500">
                  Target: {kpi.target.toLocaleString()}
                </div>

                <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">

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
            );
          })}
        </div>
      </section>

      {/* TRENDING */}

      <div className="grid gap-6 lg:grid-cols-2 mb-10">

        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="text-xl font-bold mb-4">
            Revenue Trend
          </h3>
        
          <RevenueTrend />
        </div>

        <ChartPlaceholder title="Profit Trend" />

      </div>

      {/* ALERTS */}

      <section className="mb-10">
        <div className="rounded-2xl bg-white p-6 shadow">

          <h2 className="text-2xl font-bold mb-4">
            Executive Alerts
          </h2>

          {critical === 0 ? (
            <div className="text-green-600">
              No critical KPI alerts.
            </div>
          ) : (
            <div className="text-red-600">
              Critical KPI thresholds exceeded.
            </div>
          )}
        </div>
      </section>

      {/* AI INSIGHTS */}

      <section className="mb-10">

        <div className="rounded-2xl bg-white p-6 shadow">

          <h2 className="text-2xl font-bold mb-4">
            AI Insights
          </h2>

          <ul className="space-y-3">

            <li>
              Revenue trending 8% below target.
            </li>

            <li>
              Profit performance stable.
            </li>

            <li>
              Cash flow remains healthy.
            </li>

            <li>
              Customer growth is accelerating.
            </li>

          </ul>

        </div>

      </section>

      {/* FORECASTING */}

      <section>

        <div className="rounded-2xl bg-white p-6 shadow">

          <h2 className="text-2xl font-bold mb-4">
            Forecasting
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <ForecastCard
              title="Revenue Forecast"
              value="$1.8M"
            />

            <ForecastCard
              title="Profit Forecast"
              value="$540K"
            />

            <ForecastCard
              title="Cash Forecast"
              value="$780K"
            />

          </div>

        </div>

      </section>

    </div>
  );
}

function SummaryCard({
  title,
  value,
  valueClass = "",
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <div className="text-gray-500">
        {title}
      </div>

      <div
        className={`text-5xl font-bold mt-3 ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color =
    status === "healthy"
      ? "bg-green-500"
      : status === "warning"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div
      className={`w-6 h-6 rounded-full ${color}`}
    />
  );
}

function ChartPlaceholder({ title }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">

      <h3 className="text-2xl font-bold mb-5">
        {title}
      </h3>

      <div className="h-72 rounded-xl border-2 border-dashed flex items-center justify-center text-gray-400">
        Chart Component
      </div>

    </div>
  );
}

function ForecastCard({ title, value }) {
  return (
    <div className="rounded-xl border p-5">

      <div className="text-gray-500">
        {title}
      </div>

      <div className="text-3xl font-bold mt-2">
        {value}
      </div>

    </div>
  );
}
