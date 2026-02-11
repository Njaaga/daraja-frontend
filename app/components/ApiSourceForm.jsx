"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getTenant } from "@/lib/apiClient";

export default function ApiSourceForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [form, setForm] = useState(
    initialData || {
      name: "",
      base_url: "",
      provider: "generic",
      auth_type: "NONE",

      api_key: "",
      api_key_name: "Authorization",

      bearer_token: "",
      bearer_prefix: "Bearer",

      jwt_secret: "",
      jwt_subject: "",
      jwt_audience: "",
      jwt_issuer: "",
      jwt_ttl_seconds: 3600,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ----------------------------
  // Generic input handler
  // ----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------
  // Save generic API source
  // ----------------------------
  const saveSource = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/api-sources/${form.id}/`
        : `/api/api-sources/`;

      const method = isEdit ? "PUT" : "POST";

      const payload = { ...form };

      // Remove empty secrets
      if (!payload.api_key) delete payload.api_key;
      if (!payload.jwt_secret) delete payload.jwt_secret;
      if (!payload.bearer_token) delete payload.bearer_token;

      await apiClient(url, {
        method,
        body: JSON.stringify(payload),
      });

      router.push("/api-sources");
    } catch (err) {
      console.error(err);
      setError("Failed to save API source");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // QuickBooks OAuth redirect
  // ----------------------------
  const connectQuickBooks = () => {
    const tenant = localStorage.getItem("tenant");
    
    window.location.href =
      `${API_BASE}/api/oauth/quickbooks/connect?tenant=${tenant}`;
  };

  const isApiKey =
    form.auth_type === "API_KEY_HEADER" ||
    form.auth_type === "API_KEY_QUERY";

  const isBearer = form.auth_type === "BEARER";
  const isJWT = form.auth_type === "JWT_HS256";
  const isQuickBooks = form.provider === "quickbooks";

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit API Source" : "Add API Source"}
      </h2>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Provider */}
      <select
        name="provider"
        value={form.provider}
        onChange={handleChange}
        className="border p-3 rounded-lg w-full mb-3"
      >
        <option value="generic">Generic API</option>
        <option value="quickbooks">QuickBooks Online</option>
      </select>

      {/* QuickBooks */}
      {isQuickBooks ? (
        <button
          onClick={connectQuickBooks}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Connect QuickBooks
        </button>
      ) : (
        <>
          {/* Name */}
          <input
            name="name"
            placeholder="API Name"
            value={form.name}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full mb-3"
          />

          {/* Base URL */}
          <input
            name="base_url"
            placeholder="Base API URL"
            value={form.base_url}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full mb-3"
          />

          {/* Auth Type */}
          <select
            name="auth_type"
            value={form.auth_type}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full mb-3"
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
                placeholder="API Key"
                value={form.api_key}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
              <input
                name="api_key_name"
                placeholder="Header / Query name"
                value={form.api_key_name}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
            </>
          )}

          {/* Bearer */}
          {isBearer && (
            <>
              <input
                name="bearer_token"
                type="password"
                placeholder="Bearer Token"
                value={form.bearer_token}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
              <input
                name="bearer_prefix"
                placeholder="Bearer prefix"
                value={form.bearer_prefix}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
            </>
          )}

          {/* JWT */}
          {isJWT && (
            <>
              <input
                name="jwt_secret"
                type="password"
                placeholder="JWT Secret"
                value={form.jwt_secret}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
              <input
                name="jwt_subject"
                placeholder="JWT Subject"
                value={form.jwt_subject}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
              <input
                name="jwt_audience"
                placeholder="JWT Audience"
                value={form.jwt_audience}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full mb-3"
              />
            </>
          )}

          <button
            onClick={saveSource}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save API Source"}
          </button>
        </>
      )}
    </div>
  );
}
