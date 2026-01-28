"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * DashboardView - full-featured read-only dashboard
 */
export default function DashboardView({ params }) {
  const { id } = params;

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [kpiValues, setKpiValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const dashboardRef = useRef(null);

  // Fetch dashboard & chart data
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

      // Bulk KPI fetch
      const kpis = mappedCharts.filter((c) => c.type === "kpi");
      if (kpis.length) {
        const payload = kpis.map((k) => ({
          chart_id: k.id,
          dataset: k.datasetId,
          field: k.yField,
          aggregation: k.aggregation,
        }));

        const values = await apiClient(`/api/dashboards/${id}/kpis/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!cancelled) setKpiValues(values || {});
      }
    } catch (err) {
      if (!cancelled) setError("Failed to load dashboard.");
      console.error(err);
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshKey]);

  // ---------------------------
  // Export CSV (API-side)
  // ---------------------------
  const exportCSV = async () => {
    try {
      const res = await apiClient(`/api/dashboards/${id}/export/`);
      const blob = new Blob([res], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dashboard.name || "dashboard"}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export CSV.");
    }
  };

  // ---------------------------
  // Export PDF (client-side)
  // ---------------------------
  const exportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${dashboard.name || "dashboard"}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;

  return (
    <div className="p-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600">{dashboard.description}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="border px-4 py-2 rounded hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Charts */}
      {charts.length === 0 ? (
        <div className="text-gray-500">No charts to display</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {charts.map((chart) => (
            <div key={chart.id} className="bg-white rounded-lg shadow p-4">
              {chart.type === "kpi" ? (
                <div>
                  <span className="block text-sm text-gray-500">{chart.label}</span>
                  <span className="block text-xl font-semibold">
                    {kpiValues[chart.id]}
                  </span>
                </div>
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
