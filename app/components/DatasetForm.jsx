"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import DatasetRunner from "./DatasetRunner";

export default function DatasetForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [sources, setSources] = useState([]);
  const [entities, setEntities] = useState([]); // <-- backend entities
  const [fieldsOptions, setFieldsOptions] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const [form, setForm] = useState(
    initialData || {
      name: "",
      api_source: "",
      endpoint: "",
      query_params: {},
      entity: "",
      fields: [],
      filters: {
        date_field: "",
        from: "",
        to: "",
        equals: {},
      },
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

  // Find selected source
  const selectedSource = sources.find(
    (s) => s.id.toString() === form.api_source?.toString()
  );

  // Fetch QuickBooks entities when API source changes
  useEffect(() => {
    if (!selectedSource) return;
    if (selectedSource.provider?.toLowerCase() !== "quickbooks") return;

    const fetchEntities = async () => {
      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/`
        );
        if (Array.isArray(res)) {
          setEntities(res); // res is already { value, label }
        } else {
          setEntities([]);
        }
      } catch {
        setError("Failed to load QuickBooks entities.");
      }
    };
    fetchEntities();
  }, [selectedSource]);

  // Fetch QuickBooks fields when entity changes
  useEffect(() => {
    const fetchFields = async () => {
      if (!selectedSource) return;
      if (selectedSource.provider?.toLowerCase() !== "quickbooks") return;
      if (!form.entity) return;

      setFieldsLoading(true);
      setFieldsOptions([]);
      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/${form.entity}/fields/`
        );

        if (res?.fields && Array.isArray(res.fields)) {
          setFieldsOptions(res.fields);
        } else {
          setFieldsOptions([]);
        }
      } catch {
        setError("Failed to fetch QuickBooks entity fields.");
      } finally {
        setFieldsLoading(false);
      }
    };
    fetchFields();
  }, [selectedSource, form.entity]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFieldToggle = (field) => {
    const updatedFields = form.fields.includes(field)
      ? form.fields.filter((f) => f !== field)
      : [...form.fields, field];
    setForm({ ...form, fields: updatedFields });
  };

  const handleFilterChange = (key, value) => {
    setForm({
      ...form,
      filters: { ...form.filters, [key]: value },
    });
  };

  const handleEqualsFilterChange = (key, value) => {
    setForm({
      ...form,
      filters: {
        ...form.filters,
        equals: { ...form.filters.equals, [key]: value },
      },
    });
  };

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

          {selectedSource?.provider?.toLowerCase() === "quickbooks" && (
            <>
              <select
                name="entity"
                value={form.entity}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              >
                <option value="">Select Entity</option>
                {entities.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>

              <div className="space-y-1 border p-3 rounded-lg">
                <p className="font-medium mb-2">Fields</p>
                {fieldsLoading ? (
                  <p className="text-gray-500">Loading fields...</p>
                ) : fieldsOptions.length > 0 ? (
                  fieldsOptions.map((f) => (
                    <label key={f} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.fields.includes(f)}
                        onChange={() => handleFieldToggle(f)}
                      />
                      {f}
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400">No fields available.</p>
                )}
              </div>
            </>
          )}

          {selectedSource?.provider?.toLowerCase() !== "quickbooks" && (
            <input
              name="endpoint"
              placeholder="/users or /sales/daily"
              value={form.endpoint}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          )}

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
