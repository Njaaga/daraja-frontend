"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import DatasetRunner from "./DatasetRunner";

export default function DatasetForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [sources, setSources] = useState([]);
  const [entities, setEntities] = useState([]);
  const [fieldsOptions, setFieldsOptions] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState(
    initialData || {
      name: "",
      api_source: "",
      entity: "",
      fields: [],
      filters: { date_field: "", from: "", to: "", equals: {} },
      endpoint: "",
      query_params: {},
    }
  );

  // Fetch API sources
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

  const selectedSource = sources.find(
    (s) => s.id.toString() === form.api_source?.toString()
  );

  // Fetch entities when source changes
  useEffect(() => {
    const fetchEntities = async () => {
      if (!selectedSource) return;
      if (selectedSource.provider?.toLowerCase() !== "quickbooks") {
        setEntities([]);
        return;
      }

      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/`
        );
        setEntities(Array.isArray(res) ? res : []);
      } catch {
        setError("Failed to fetch QuickBooks entities.");
      }
    };
    fetchEntities();
    setForm({ ...form, entity: "", fields: [] }); // reset entity/fields
    setFieldsOptions([]);
  }, [selectedSource]);

  // Fetch fields when entity changes
  useEffect(() => {
    const fetchFields = async () => {
      if (!selectedSource || !form.entity) return;

      setFieldsLoading(true);
      setFieldsOptions([]);
      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/${form.entity}/fields/`
        );
        setFieldsOptions(res.fields || []);
      } catch {
        setError("Failed to fetch QB entity fields.");
      } finally {
        setFieldsLoading(false);
      }
    };
    fetchFields();
    setForm({ ...form, fields: [] }); // reset selected fields
  }, [selectedSource, form.entity]);

  // Handle form changes
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFieldToggle = (field) => {
    const updatedFields = form.fields.includes(field)
      ? form.fields.filter((f) => f !== field)
      : [...form.fields, field];
    setForm({ ...form, fields: updatedFields });
  };

  const handleFilterChange = (key, value) => {
    setForm({ ...form, filters: { ...form.filters, [key]: value } });
  };

  const handleEqualsFilterChange = (key, value) => {
    setForm({
      ...form,
      filters: { ...form.filters, equals: { ...form.filters.equals, [key]: value } },
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
      setTimeout(() => router.push("/datasets"), 800);
    } catch {
      setError("Error saving dataset.");
    } finally {
      setLoading(false);
    }
  };

  const runPreview = async () => {
    setPreview(null);
    setError(null);

    if (!form.id) return setError("Please save the dataset before previewing.");

    try {
      const res = await apiClient(`/api/datasets/${form.id}/run/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res || res.detail) return setError(res?.detail || "Failed to preview dataset.");
      setPreview(res);
    } catch {
      setError("Error running preview.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push("/datasets")} className="text-sm text-gray-600 hover:underline">
          ← Back to datasets
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">{isEdit ? "Edit Dataset" : "Create Dataset"}</h2>
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
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* QuickBooks Section */}
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
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              {/* Fields Picker */}
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

          {/* REST Section */}
          {selectedSource?.provider?.toLowerCase() !== "quickbooks" && (
            <>
              <input
                name="endpoint"
                placeholder="/users or /sales/daily"
                value={form.endpoint}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </>
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
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Dataset"}
            </button>
          </div>
        </div>

        {preview && <div className="mt-6"><DatasetRunner data={preview} /></div>}
      </div>
    </div>
  );
}
