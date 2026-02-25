"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/apiClient";

export default function DatasetForm({ initialData = null }) {
  const [sources, setSources] = useState([]);
  const [entities, setEntities] = useState([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(
    initialData || {
      api_source: "",
      entity: "",
      fields: [],
    }
  );

  /* ----------------------------------------------------
     Fetch API Sources
  ---------------------------------------------------- */
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await apiClient("/api/api-sources/");
        setSources(Array.isArray(res) ? res : res?.results || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load API sources.");
      }
    };

    fetchSources();
  }, []);

  /* ----------------------------------------------------
     Fetch QuickBooks Entities (FIXED)
  ---------------------------------------------------- */
  useEffect(() => {
    const fetchEntities = async () => {
      if (!form.api_source) return;

      const source = sources.find(
        (s) => s.id.toString() === form.api_source.toString()
      );

      // Flexible provider check (IMPORTANT FIX)
      if (
        !source?.provider ||
        !source.provider.toLowerCase().includes("quickbooks")
      ) {
        return;
      }

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
          `/api/api-sources/${source.id}/entities/`
        );

        // Handle multiple possible response shapes
        let entityList = [];

        if (Array.isArray(res)) {
          entityList = res;
        } else if (Array.isArray(res?.entities)) {
          entityList = res.entities;
        } else if (Array.isArray(res?.results)) {
          entityList = res.results;
        }

        setEntities(entityList);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch QuickBooks entities.");
      } finally {
        setEntitiesLoading(false);
      }
    };

    fetchEntities();
  }, [form.api_source, sources]); // Proper dependency fix

  /* ----------------------------------------------------
     Handle Form Changes
  ---------------------------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ----------------------------------------------------
     UI
  ---------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* API SOURCE */}
      <div>
        <label className="block mb-2 font-medium">
          API Source
        </label>
        <select
          name="api_source"
          value={form.api_source}
          onChange={handleChange}
          className="border p-3 rounded-lg w-full"
        >
          <option value="">Select API Source</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      {/* ENTITY DROPDOWN */}
      <div>
        <label className="block mb-2 font-medium">
          Entity
        </label>
        <select
          name="entity"
          value={form.entity}
          onChange={handleChange}
          className="border p-3 rounded-lg w-full"
          disabled={entitiesLoading}
        >
          <option value="">
            {entitiesLoading
              ? "Loading entities..."
              : "Select Entity"}
          </option>

          {entities.map((entity) => (
            <option
              key={entity.value}
              value={entity.value}
            >
              {entity.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
