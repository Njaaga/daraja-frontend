"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import DatasetRunner from "./DatasetRunner";

export default function DatasetForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [sources, setSources] = useState([]);
  const [entities, setEntities] = useState([]);
  const [fieldsOptions, setFieldsOptions] = useState([]);

  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [preview, setPreview] = useState(null);

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

  /* ----------------------------------
     Load API Sources
  ---------------------------------- */
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

  const selectedSource = useMemo(() => {
    return sources.find(
      (s) => s.id.toString() === form.api_source?.toString()
    );
  }, [sources, form.api_source]);

  const isQuickBooks =
    selectedSource?.provider?.toLowerCase() === "quickbooks";

  /* ----------------------------------
     Fetch QuickBooks Entities
     GET /api/api-sources/{id}/entities/
  ---------------------------------- */
  useEffect(() => {
    const fetchEntities = async () => {
      if (!isQuickBooks || !selectedSource) return;

      setEntities([]);
      setEntitiesLoading(true);
      setError(null);

      // Reset entity + fields when source changes
      setForm((prev) => ({
        ...prev,
        entity: "",
        fields: [],
      }));

      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/`
        );

        if (Array.isArray(res)) {
          setEntities(res); // expecting [{value,label}]
        } else {
          setEntities([]);
        }
      } catch {
        setError("Failed to fetch QuickBooks entities.");
      } finally {
        setEntitiesLoading(false);
      }
    };

    fetchEntities();
  }, [isQuickBooks, selectedSource]);

  /* ----------------------------------
     Fetch QuickBooks Fields
     GET /api/api-sources/{id}/entities/{entity}/fields/
  ---------------------------------- */
  useEffect(() => {
    const fetchFields = async () => {
      if (!isQuickBooks || !form.entity || !selectedSource) return;

      setFieldsOptions([]);
      setFieldsLoading(true);
      setError(null);

      // Reset selected fields when entity changes
      setForm((prev) => ({ ...prev, fields: [] }));

      try {
        const res = await apiClient(
          `/api/api-sources/${selectedSource.id}/entities/${form.entity}/fields/`
        );

        if (Array.isArray(res?.fields)) {
          setFieldsOptions(res.fields);
        } else {
          setFieldsOptions([]);
        }
      } catch {
        setError("Failed to fetch entity fields.");
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, [form.entity, isQuickBooks, selectedSource]);

  /* ----------------------------------
     Handlers
  ---------------------------------- */

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFieldToggle = (field) => {
    setForm((prev) => {
      const exists = prev.fields.includes(field);
      return {
        ...prev,
        fields: exists
          ? prev.fields.filter((f) => f !== field)
          : [...prev.fields, field],
      };
    });
  };

  const handleFilterChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  /* ----------------------------------
     Save Dataset
  ---------------------------------- */
  const saveDataset = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = isEdit
        ? `/api/datasets/${form.id}/`
        : `/api/datasets/`;

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

  /* ----------------------------------
     Preview Dataset
  ---------------------------------- */
  const runPreview = async () => {
    setError(null);
    setPreview(null);

    if (!form.id) {
      setError("Please save dataset before preview.");
      return;
    }

    if (isQuickBooks) {
      if (!form.entity) {
        setError("Select an entity.");
        return;
      }
      if (form.fields.length === 0) {
        setError("Select at least one field.");
        return;
      }
    }

    setPreviewLoading(true);

    try {
      const res = await apiClient(
        `/api/datasets/${form.id}/run/`,
        { method: "POST", body: JSON.stringify({}) }
      );

      if (!res || res.detail) {
        setError(res?.detail || "Preview failed.");
        return;
      }

      setPreview(res);
    } catch {
      setError("Error running preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ----------------------------------
     Render
  ---------------------------------- */

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit Dataset" : "Create Dataset"}
        </h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}
        {successMsg && (
          <div className="mb-4 text-green-600">{successMsg}</div>
        )}

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

          {/* QUICKBOOKS UI */}
          {isQuickBooks && (
            <>
              <select
                name="entity"
                value={form.entity}
                onChange={handleChange}
                disabled={entitiesLoading}
                className="border p-3 rounded-lg"
              >
                <option value="">
                  {entitiesLoading
                    ? "Loading entities..."
                    : "Select Entity"}
                </option>

                {entities.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>

              <div className="border p-3 rounded-lg">
                <p className="font-medium mb-2">Fields</p>

                {fieldsLoading ? (
                  <p className="text-gray-500">Loading fields...</p>
                ) : fieldsOptions.length > 0 ? (
                  fieldsOptions.map((f) => (
                    <label
                      key={f}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.fields.includes(f)}
                        onChange={() => handleFieldToggle(f)}
                      />
                      {f}
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400">
                    No fields available.
                  </p>
                )}
              </div>

              <div className="border p-3 rounded-lg space-y-2">
                <p className="font-medium">Date Filter</p>

                <input
                  type="text"
                  placeholder="Date field (e.g. TxnDate)"
                  value={form.filters.date_field}
                  onChange={(e) =>
                    handleFilterChange(
                      "date_field",
                      e.target.value
                    )
                  }
                  className="border p-2 rounded w-full"
                />

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={form.filters.from}
                    onChange={(e) =>
                      handleFilterChange("from", e.target.value)
                    }
                    className="border p-2 rounded w-1/2"
                  />
                  <input
                    type="date"
                    value={form.filters.to}
                    onChange={(e) =>
                      handleFilterChange("to", e.target.value)
                    }
                    className="border p-2 rounded w-1/2"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4 mt-4">
            <button
              onClick={runPreview}
              disabled={previewLoading}
              className={`py-2 rounded-lg text-white flex-1 ${
                previewLoading
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {previewLoading ? "Running..." : "Preview Data"}
            </button>

            <button
              onClick={saveDataset}
              disabled={loading}
              className={`py-2 rounded-lg text-white flex-1 ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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
