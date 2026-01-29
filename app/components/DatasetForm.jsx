"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import DatasetRunner from "./DatasetRunner";

export default function DatasetForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(
    initialData || {
      name: "",
      api_source: "",
      endpoint: "",
      query_params: {},
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [preview, setPreview] = useState(null);

  // Load API sources
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const data = await apiClient("/api/api-sources/");
        if (Array.isArray(data)) setSources(data);
      } catch {
        setError("Failed to load API sources.");
      }
    };
    fetchSources();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addQueryParam = () => {
    setForm({
      ...form,
      query_params: { ...form.query_params, [""]: "" },
    });
  };

  // Save dataset
  const saveDataset = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = isEdit ? `/api/datasets/${form.id}/` : `/api/datasets/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await apiClient(url, {
        method,
        body: JSON.stringify(form),
      });

      if (!res || res.detail) {
        setError(res?.detail || "Failed to save dataset.");
        return;
      }

      setSuccessMsg("Dataset saved successfully!");
      setTimeout(() => {
        router.push("/datasets");
      }, 800);
    } catch {
      setError("Error saving dataset.");
    } finally {
      setLoading(false);
    }
  };

  // Preview dataset
  const runPreview = async () => {
    setPreview(null);
    setError(null);

    if (!form.id) {
      setError("Please save the dataset before previewing.");
      return;
    }

    try {
      const res = await apiClient(`/api/datasets/${form.id}/run/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res || res.detail) {
        setError(res?.detail || "Failed to preview dataset.");
        return;
      }

      setPreview(res);
    } catch {
      setError("Error running preview.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push("/datasets")}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to datasets
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit Dataset" : "Create Dataset"}
        </h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}
        {successMsg && <div className="mb-4 text-green-600">{successMsg}</div>}

        <div className="grid gap-4">
          <input
            name="name"
            placeholder="Dataset name"
            value={form.name}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />

          <select
            name="api_source"
            value={form.api_source}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value="">Select API Source</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            name="endpoint"
            placeholder="/users or /sales/daily"
            value={form.endpoint}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />

          {/* Query Params */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium">Query Parameters</label>
              <button
                onClick={addQueryParam}
                className="text-sm bg-gray-200 px-2 py-1 rounded"
                type="button"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(form.query_params).map(([k, v], idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    placeholder="key"
                    value={k}
                    onChange={(e) => {
                      const newParams = { ...form.query_params };
                      delete newParams[k];
                      newParams[e.target.value] = v;
                      setForm({ ...form, query_params: newParams });
                    }}
                    className="border p-2 rounded w-1/2"
                  />
                  <input
                    placeholder="value"
                    value={v}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        query_params: {
                          ...form.query_params,
                          [k]: e.target.value,
                        },
                      });
                    }}
                    className="border p-2 rounded w-1/2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={runPreview}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex-1"
            >
              Preview Data
            </button>

            <button
              onClick={saveDataset}
              className={`py-2 rounded-lg text-white flex-1 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Dataset"}
            </button>
          </div>
        </div>

        {preview && (
          <div className="mt-6">
            <DatasetRunner data={preview} />
          </div>
        )}
      </div>
    </div>
  );
}
