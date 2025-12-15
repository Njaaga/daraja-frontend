"use client";
import { useEffect, useState } from "react";
import ChartPreview from "./ChartPreview";

export default function ChartBuilder() {
  const [datasets, setDatasets] = useState([]);
  const [fields, setFields] = useState([]);
  const [data, setData] = useState([]);

  const [form, setForm] = useState({
    name: "",
    dataset: "",
    chart_type: "bar",
    x_field: "",
    y_field: "",
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/datasets/")
      .then((r) => r.json())
      .then(setDatasets);
  }, []);

  const fetchPreview = async (datasetId) => {
    const res = await fetch(`http://localhost:8000/api/datasets/${datasetId}/run/`);
    const d = await res.json();
    setData(d);

    if (d.length > 0) setFields(Object.keys(d[0]));
  };

  const saveChart = async () => {
    const res = await fetch("http://localhost:8000/api/charts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) window.location.href = "/charts";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Create Chart</h2>

      <div className="grid gap-4">
        <input
          placeholder="Chart name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-3 rounded-lg"
        />

        <select
          value={form.dataset}
          onChange={(e) => {
            setForm({ ...form, dataset: e.target.value });
            fetchPreview(e.target.value);
          }}
          className="border p-3 rounded-lg"
        >
          <option value="">Select Dataset</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={form.chart_type}
          onChange={(e) => setForm({ ...form, chart_type: e.target.value })}
          className="border p-3 rounded-lg"
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="kpi">KPI Number</option>
        </select>

        <select
          value={form.x_field}
          onChange={(e) => setForm({ ...form, x_field: e.target.value })}
          className="border p-3 rounded-lg"
        >
          <option value="">Select X Field</option>
          {fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {form.chart_type !== "kpi" && (
          <select
            value={form.y_field}
            onChange={(e) => setForm({ ...form, y_field: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Y Field</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={saveChart}
          className="bg-blue-600 py-2 text-white rounded-lg"
        >
          Save Chart
        </button>
      </div>

      {data.length > 0 && (
        <div className="mt-6">
          <ChartPreview
            type={form.chart_type}
            data={data}
            x={form.x_field}
            y={form.y_field}
          />
        </div>
      )}
    </div>
  );
}
