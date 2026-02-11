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
      entity: "",
      fields: [],
      filters: {},
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [preview, setPreview] = useState(null);
  const [entities, setEntities] = useState([]);
  const [qbFields, setQbFields] = useState([]);

  const [selectedEntity, setSelectedEntity] = useState(form.entity);
  const [selectedFields, setSelectedFields] = useState(form.fields || []);

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

  // Fetch QuickBooks entities (static list for demo)
  useEffect(() => {
    const source = sources.find(s => s.id.toString() === form.api_source?.toString());
    if (source?.provider === "quickbooks") {
      // QuickBooks standard entities
      setEntities(["Customer", "Invoice", "Payment", "Account"]);
    } else {
      setEntities([]);
      setSelectedEntity("");
      setSelectedFields([]);
      setQbFields([]);
    }
  }, [form.api_source, sources]);

  // Fetch QuickBooks fields when entity changes
  useEffect(() => {
    if (!selectedEntity) return;
    const source = sources.find(s => s.id.toString() === form.api_source?.toString());
    if (!source || source.provider !== "quickbooks") return;

    setLoading(true);
    apiClient(`/api/api-sources/${source.id}/entity_fields/${selectedEntity}/`)
      .then(res => {
        setQbFields(res.fields || []);
        // Auto-select all fields if none selected yet
        if (!isEdit || selectedFields.length === 0) setSelectedFields(res.fields || []);
      })
      .catch(() => setError("Failed to fetch QuickBooks entity fields."))
      .finally(() => setLoading(false));
  }, [selectedEntity, form.api_source]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFieldToggle = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const saveDataset = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      ...form,
      entity: selectedEntity,
      fields: selectedFields,
    };

    try {
      const url = isEdit ? `/api/datasets/${form.id}/` : `/api/datasets/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await apiClient(url, {
        method,
        body: JSON.stringify(payload),
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
            onChange={(e) => {
              handleChange(e);
              setSelectedEntity("");
              setSelectedFields([]);
              setQbFields([]);
            }}
            className="border p-3 rounded-lg"
          >
            <option value="">Select API Source</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.provider === "quickbooks" ? "(QuickBooks)" : ""}
              </option>
            ))}
          </select>

          {entities.length > 0 && (
            <select
              name="entity"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="border p-3 rounded-lg"
            >
              <option value="">Select Entity</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          )}

          {qbFields.length > 0 && (
            <div>
              <label className="font-medium">Select Fields</label>
              <div className="grid grid-cols-2 gap-2 mt-1 max-h-48 overflow-y-auto border p-2 rounded">
                {qbFields.map((field) => (
                  <label key={field} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => handleFieldToggle(field)}
                    />
                    {field}
                  </label>
                ))}
              </div>
            </div>
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

          {preview && (
            <div className="mt-6">
              <DatasetRunner data={preview} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
