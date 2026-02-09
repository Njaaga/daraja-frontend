"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function ApiSourceForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [form, setForm] = useState(
    initialData || {
      name: "",
      base_url: "",
      auth_type: "NONE",
      provider: "generic",

      // API key
      api_key: "",
      api_key_header: "Authorization",

      // Bearer (generic only)
      bearer_token: "",
      bearer_prefix: "Bearer",

      // JWT
      jwt_secret: "",
      jwt_subject: "",
      jwt_audience: "",
      jwt_issuer: "",
      jwt_ttl_seconds: 3600,

      // OAuth metadata (read-only)
      realm_id: null,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [blocked, setBlocked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSource = async () => {
    if (loading || blocked) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = isEdit
        ? `/api/api-sources/${form.id}/`
        : `/api/api-sources/`;

      const method = isEdit ? "PUT" : "POST";
      const payload = { ...form };

      // Never send secrets unnecessarily
      if (!payload.api_key) delete payload.api_key;
      if (!payload.jwt_secret) delete payload.jwt_secret;
      if (!payload.bearer_token) delete payload.bearer_token;

      const res = await apiClient(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res?.status === "subscription_blocked") {
        setBlocked(true);
        setError("Your subscription plan does not allow more API sources.");
        return;
      }

      setSuccessMsg("API source saved successfully!");
      setTimeout(() => router.push("/api-sources"), 800);
    } catch (err) {
      console.error(err);
      setError("Error saving API source.");
    } finally {
      setLoading(false);
    }
  };

  const isApiKey =
    form.auth_type === "API_KEY_HEADER" ||
    form.auth_type === "API_KEY_QUERY";

  const isJWT = form.auth_type === "JWT_HS256";
  const isBearer = form.auth_type === "BEARER";
  const isQuickBooks = form.provider === "quickbooks";

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.push("/api-sources")}
        className="text-sm text-gray-600 hover:underline mb-4"
      >
        ← Back to API sources
      </button>

      <div className="p-6 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit API Source" : "Add API Source"}
        </h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}
        {successMsg && <div className="mb-4 text-green-600">{successMsg}</div>}

        <div className="grid gap-4">
          {/* Name */}
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />

          {/* Provider */}
          <select
            name="provider"
            value={form.provider}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value="generic">Generic API</option>
            <option value="quickbooks">QuickBooks Online</option>
          </select>

          {/* Base URL */}
          <input
            name="base_url"
            placeholder="Base API URL"
            value={
              isQuickBooks
                ? "https://quickbooks.api.intuit.com/v3/company/{realm_id}"
                : form.base_url
            }
            onChange={handleChange}
            disabled={isQuickBooks}
            className="border p-3 rounded-lg disabled:bg-gray-100"
          />

          {/* Auth type */}
          <select
            name="auth_type"
            value={isQuickBooks ? "BEARER" : form.auth_type}
            onChange={handleChange}
            disabled={isQuickBooks}
            className="border p-3 rounded-lg disabled:bg-gray-100"
          >
            <option value="NONE">None</option>
            <option value="API_KEY_HEADER">API Key (Header)</option>
            <option value="API_KEY_QUERY">API Key (Query)</option>
            <option value="BEARER">Bearer Token</option>
            <option value="JWT_HS256">JWT (HS256)</option>
          </select>

          {/* API Key */}
          {isApiKey && !isQuickBooks && (
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
                placeholder="Header / Query Param Name"
                value={form.api_key_header}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </>
          )}

          {/* Generic Bearer */}
          {isBearer && !isQuickBooks && (
            <>
              <input
                name="bearer_token"
                type="password"
                placeholder="Bearer Token"
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

          {/* QuickBooks OAuth */}
          {isQuickBooks && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  (window.location.href =
                    "/api/oauth/quickbooks/connect")
                }
                className="py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                {form.realm_id
                  ? "Reconnect QuickBooks"
                  : "Connect QuickBooks"}
              </button>

              {form.realm_id && (
                <div className="text-sm text-green-600">
                  ✔ Connected to QuickBooks company {form.realm_id}
                </div>
              )}
            </div>
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
                placeholder="JWT Issuer (iss)"
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
                ? "bg-gray-400"
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
