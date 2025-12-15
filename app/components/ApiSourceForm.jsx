"use client";
import { useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";

export default function ApiSourceForm({ initialData = null, isEdit = false }) {
  const [form, setForm] = useState(
    initialData || {
      name: "",
      base_url: "",
      auth_type: "NONE",
      api_key: "",
      api_key_header: "Authorization",
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveSource = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = isEdit
        ? `/api/api-sources/${form.id}/`
        : `/api/api-sources/`;

      const method = isEdit ? "PUT" : "POST";

      const res = await apiClient(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res) {
        setError("Failed to save API source. Are you logged in?");
        return;
      }

      setSuccessMsg("API source saved successfully!");
      // redirect after short delay
      setTimeout(() => {
        window.location.href = "/api-sources";
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Error saving API source. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const endpoint = prompt("Enter endpoint to test (e.g. /users):");
    if (!endpoint) return;

    setTestResult(null);
    setError(null);

    try {
      const res = await apiClient(`/api/api-sources/${form.id}/test_connection/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      if (!res) {
        setError("Failed to test connection. Are you logged in?");
        return;
      }

      setTestResult(res);
    } catch (err) {
      console.error(err);
      setError("Error testing connection. Check console for details.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit API Source" : "Add API Source"}
      </h2>

      {error && <div className="mb-4 text-red-600">{error}</div>}
      {successMsg && <div className="mb-4 text-green-600">{successMsg}</div>}

      <div className="grid gap-4">
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <input
          name="base_url"
          placeholder="Base API URL"
          value={form.base_url}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <select
          name="auth_type"
          value={form.auth_type}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        >
          <option value="NONE">None</option>
          <option value="API_KEY">API Key (Header)</option>
          <option value="BEARER">Bearer Token</option>
          <option value="QUERY_KEY">API Key (Query Param)</option>
        </select>

        <input
          name="api_key"
          placeholder="API Key (hidden)"
          type="password"
          value={form.api_key}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <input
          name="api_key_header"
          placeholder="API Key Header"
          value={form.api_key_header}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={saveSource}
          className={`py-2 rounded-lg text-white ${loading ? "bg-gray-500" : "bg-blue-600"}`}
          disabled={loading}
        >
          {loading ? "Saving..." : isEdit ? "Update Source" : "Save Source"}
        </button>

        {isEdit && (
          <button
            onClick={testConnection}
            className="bg-green-600 text-white py-2 rounded-lg"
          >
            Test Connection
          </button>
        )}
      </div>

      {testResult && (
        <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-auto">
          {JSON.stringify(testResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
