"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";

/**
 * DashboardView
 * Read-only dashboard viewer
 */
export default function DashboardView({ params }) {
  const { id } = params;

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [kpiValues, setKpiValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient(`/api/dashboards/${id}/`);
      if (cancelled) return;

      setDashboard(res);

      const mappedCharts = (res.dashboard_charts || []).map((dc) => ({
        id: dc.id,
        chartId: dc.chart,
        type: dc.chart_detail.chart_type,

        label:
          dc.chart_detail.label ||
          dc.chart_detail.title ||
          dc.chart_detail.y_field,

        datasetId: dc.chart_detail.dataset,
        xField: dc.chart_detail.x_field,
        yField: dc.chart_detail.y_field,
        aggregation: dc.chart_detail.aggregation,

        filters: dc.chart_detail.filters || {},
        logicRules: dc.chart_detail.logic_rules || [],
        logicExpression: dc.chart_detail.logic_expression || null,
        joins: dc.chart_detail.joins || [],
        calculatedFields: dc.chart_detail.calculated_fields || [],
      }));

      setCharts(mappedCharts);

      /**
       * 🔥 Bulk KPI fetch
       */
      const kpis = mappedCharts.filter((c) => c.type === "kpi");
      if (kpis.length) {
        const payload = kpis.map((k) => ({
          chart_id: k.id,
          dataset: k.datasetId,
          field: k.yField,
          aggregation: k.aggregation,
        }));

        const values = await apiClient(
          `/api/dashboards/${id}/kpis/`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        if (!cancelled) {
          setKpiValues(values || {});
        }
      }
    } catch (err) {
      if (!cancelled) {
        setError("Failed to load dashboard.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshKey]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="p-6">
      {/* Header */}
      <DashboardHeader
        title={dashboard.name}
        description={dashboard.description}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {/* Content */}
      {charts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="bg-white rounded-lg shadow p-4"
            >
              {chart.type === "kpi" ? (
                <KPIBlock
                  label={chart.label}
                  value={kpiValues[chart.id]}
                />
              ) : (
                <ChartRenderer
                  key={`${chart.id}-${refreshKey}`}
                  datasetId={chart.datasetId}
                  type={chart.type}
                  xField={chart.xField}
                  yField={chart.yField}
                  filters={chart.filters}
                  logicRules={chart.logicRules}
                  logicExpression={chart.logicExpression}
                  joins={chart.joins}
                  calculatedFields={chart.calculatedFields}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
