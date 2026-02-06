"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import ChartRenderer from "@/app/components/ChartRenderer";
import ChartDetailsModal from "@/app/components/ChartDetailsModal";
import { apiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ====================== UTILS ====================== */
const getValue = (obj, path) =>
  path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

const applyFilters = (rows, filters) => {
  return rows.filter((row) =>
    Object.entries(filters).every(([field, rule]) => {
      const value = getValue(row, field);
      if (rule.type === "text")
        return String(value ?? "").toLowerCase().includes(rule.value.toLowerCase());
      if (rule.type === "select")
        return rule.value ? value === rule.value : true;
      if (rule.type === "date")
        return (
          (!rule.from || new Date(value) >= new Date(rule.from)) &&
          (!rule.to || new Date(value) <= new Date(rule.to))
        );
      return true;
    })
  );
};

/* ====================== SLICER PANEL ====================== */
function SlicerPanel({ fields, data, filters, onChange, onClear }) {
  if (!fields.length) return null;

  const distinctValues = (field) =>
    Array.from(
      new Set(
        data.map((r) => getValue(r, field)).filter(Boolean)
      )
    ).slice(0, 50);

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold">Dashboard Filters</h3>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-black">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-xs text-gray-600 mb-1 block">{field}</label>

            {/* Dropdown */}
            {distinctValues(field).length <= 20 ? (
              <select
                value={filters[field]?.value || ""}
                onChange={(e) =>
                  onChange(field, { type: "select", value: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                {distinctValues(field).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={filters[field]?.value || ""}
                onChange={(e) =>
                  onChange(field, { type: "text", value: e.target.value })
                }
                placeholder={`Filter ${field}`}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== DASHBOARD VIEW ====================== */
export default function DashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const dashboardRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalFields, setModalFields] = useState([]);

  /* ====================== LOAD DASHBOARD ====================== */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const db = await apiClient(`/api/dashboards/${id}/`);
        setDashboard(db);

        const mapped = db.dashboard_charts.map((dc) => {
          const c = dc.chart_detail;
          return {
            key: dc.id,
            title: c.name,
            type: c.chart_type,
            datasetId: c.dataset,
            xField: c.x_field,
            yField: c.y_field,
            stackedFields: c.stacked_fields || [],
            excelData: c.excel_data || [],
            logicRules: c.logic_rules || [],
            filters: c.filters || {},
            selectedFields: c.selected_fields || null,
          };
        });

        setCharts(mapped);
        setRows(mapped[0]?.excelData || []);

        const saved = localStorage.getItem(`dashboard-filters-${id}`);
        if (saved) setFilters(JSON.parse(saved));
      } catch {
        setError("Dashboard not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ====================== SAVE FILTERS ====================== */
  useEffect(() => {
    localStorage.setItem(`dashboard-filters-${id}`, JSON.stringify(filters));
  }, [filters, id]);

  /* ====================== SLICER FIELDS ====================== */
  const slicerFields = useMemo(() => {
    const s = new Set();
    charts.forEach((c) => {
      s.add(c.xField);
      s.add(c.yField);
    });
    return Array.from(s);
  }, [charts]);

  /* ====================== FILTERED DATA ====================== */
  const filteredRows = useMemo(
    () => applyFilters(rows, filters),
    [rows, filters]
  );

  /* ====================== CHART CLICK (CROSS FILTER) ====================== */
  const handleChartClick = ({ row }) => {
    if (!row) return;

    setFilters((prev) => ({
      ...prev,
      [Object.keys(row)[0]]: {
        type: "select",
        value: row[Object.keys(row)[0]],
      },
    }));

    setModalRows([row]);
    setModalFields(Object.keys(row));
    setModalOpen(true);
  };

  /* ====================== EXPORT PDF ====================== */
  const exportPDF = async () => {
    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
    pdf.save(`${dashboard.name}.pdf`);
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <div className="flex gap-3 items-center">
            <button onClick={() => router.push("/dashboards")} className="text-sm">
              ← Back
            </button>
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          </div>
          <button onClick={exportPDF} className="bg-gray-200 px-3 py-1 rounded">
            Export PDF
          </button>
        </div>

        {/* SLICERS */}
        <SlicerPanel
          fields={slicerFields}
          data={rows}
          filters={filters}
          onChange={(f, r) => setFilters((p) => ({ ...p, [f]: r }))}
          onClear={() => setFilters({})}
        />

        {/* CHARTS */}
        <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <div key={c.key} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">{c.title}</h3>

              <ChartRenderer
                {...c}
                excelData={filteredRows}
                filters={filters}
                onPointClick={handleChartClick}
              />
            </div>
          ))}
        </div>

        {/* MODAL */}
        <ChartDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          rows={modalRows}
          selectedFields={modalFields}
        />
      </div>
    </Layout>
  );
}
