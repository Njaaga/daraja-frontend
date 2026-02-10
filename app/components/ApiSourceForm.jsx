"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function ApiSourceForm({
  initialData = null,
  isEdit = false,
  tenantId, // ✅ added (optional but recommended)
}) {
  const router = useRouter();

  const [form, setForm] = useState(
    initialData || {
      tenant_id: tenantId || null, // ✅ FIX: persist tenant

      name: "",
      base_url: "",
      auth_type: "NONE",

      // API key
      api_key: "",
      api_key_header: "Authorization",

      // Bearer
      bearer_token: "",
      bearer_prefix: "Bearer",

      // JWT
      jwt_secret: "",
      jwt_subject: "",
      jwt_audience: "",
      jwt_issuer: "",
      jwt_ttl_seconds: 3600,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [blocked, setBlocked] = useState(false);

  /* -----------------------------
     Handlers
  ------------------------------*/
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* -----------------------------
     Save
  ------------------------------*/
  const saveSource = async () => {
    if (loading || blocked) return;

    if (!form.tenant_id) {
      setError("Tenant context is missing. Please reload the page.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = isEdit
        ? `/api/api-sources/${form.id}/`
        : `/api/api-sources/`;

      const method = isEdit ? "PUT" : "POST";
      const payload = { ...form };

      // Write-only secrets
      if (!payload.api_key) delete payload.api_key;
      if (!payload.jwt_secret) delete payload.jwt_secret;
      if (!payload.bearer_token) delete payload.bearer_token;

      const res = await apiClient(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // ✅ tenant included
      });

      if (res?.status === "subscription_blocked") {
        setBlocked(true);
        setError("Your subscription plan does not allow more API sources.");
        return;
      }

      setSuccessMsg("API source saved successfully!");
      setTimeout(() => {
        router.push("/api-sources");
      }, 800);
    } catch (err) {
      console.error(err);
      setError("Error saving API source.");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Auth helpers
  ------------------------------*/
  const isApiKey =
    form.auth_type === "API_KEY_HEADER" ||
    form.auth_type === "API_KEY_QUERY";

  const isJWT = form.auth_type === "JWT_HS256";
  const isBearer = form.auth_type === "BEARER";

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push("/api-sources")}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to API sources
        </button>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow">
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
            <option value="API_KEY_HEADER">API Key (Header)</option>
            <option value="API_KEY_QUERY">API Key (Query)</option>
            <option value="BEARER">Bearer Token</option>
            <option value="JWT_HS256">JWT (HS256)</option>
          </select>

          {/* API Key */}
          {isApiKey && (
            <>
              <input
                name="api_key"
                type="password"
                placeholder="API Key (write-only)"
                value={form.api_key}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="api_key_header"
                placeholder="API Key Header / Query Param"
                value={form.api_key_header}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </>
          )}

          {/* Bearer */}
          {isBearer && (
            <>
              <input
                name="bearer_token"
                type="password"
                placeholder="Bearer Token (write-only)"
                value={form.bearer_token}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="bearer_prefix"
                placeholder='Prefix (default: "Bearer")'
                value={form.bearer_prefix}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </>
          )}

          {/* JWT */}
          {isJWT && (
            <>
              <input
                name="jwt_secret"
                type="password"
                placeholder="JWT Secret (HS256)"
                value={form.jwt_secret}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="jwt_subject"
                placeholder="JWT Subject (sub)"
                value={form.jwt_subject}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="jwt_audience"
                placeholder="JWT Audience (aud)"
                value={form.jwt_audience}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="jwt_issuer"
                placeholder="JWT Issuer (iss) — optional"
                value={form.jwt_issuer}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
              <input
                name="jwt_ttl_seconds"
                type="number"
                placeholder="JWT TTL (seconds)"
                value={form.jwt_ttl_seconds}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </>
          )}

          <button
            onClick={saveSource}
            disabled={loading || blocked}
            className={`py-2 rounded-lg text-white ${
              loading || blocked
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : isEdit ? "Update Source" : "Save Source"}
          </button>
        </div>
      </div>
    </div>
  );
}
