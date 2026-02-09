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
      provider: "generic",
      auth_type: "NONE",

      api_key: "",
      api_key_header: "Authorization",

      bearer_token: "",
      bearer_prefix: "Bearer",

      jwt_secret: "",
      jwt_subject: "",
      jwt_audience: "",
      jwt_issuer: "",
      jwt_ttl_seconds: 3600,

      realm_id: null,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -----------------------------
     Helpers
  ------------------------------*/
  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isQuickBooks = form.provider === "quickbooks";
  const isApiKey =
    form.auth_type === "API_KEY_HEADER" ||
    form.auth_type === "API_KEY_QUERY";
  const isBearer = form.auth_type === "BEARER";
  const isJWT = form.auth_type === "JWT_HS256";

  /* -----------------------------
     Save
  ------------------------------*/
  const saveSource = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const payload = { ...form };
      ["api_key", "bearer_token", "jwt_secret"].forEach(
        (k) => !payload[k] && delete payload[k]
      );

      await apiClient(
        isEdit
          ? `/api/api-sources/${form.id}/`
          : `/api/api-sources/`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      router.push("/api-sources");
    } catch (err) {
      console.error(err);
      setError("Failed to save API source");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <button
        onClick={() => router.push("/api-sources")}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to API sources
      </button>

      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">
          {isEdit ? "Edit API Source" : "Add API Source"}
        </h2>

        {error && <p className="text-red-600">{error}</p>}

        {/* Name */}
        <input
          className="border p-3 rounded-lg w-full"
          placeholder="Name"
          value={form.name}
          onChange={update("name")}
        />

        {/* Provider */}
        <select
          className="border p-3 rounded-lg w-full"
          value={form.provider}
          onChange={update("provider")}
        >
          <option value="generic">Generic API</option>
          <option value="quickbooks">QuickBooks Online</option>
        </select>

        {/* Base URL */}
        <input
          className="border p-3 rounded-lg w-full disabled:bg-gray-100"
          placeholder="Base API URL"
          value={
            isQuickBooks
              ? "https://quickbooks.api.intuit.com/v3/company/{realm_id}"
              : form.base_url
          }
          onChange={update("base_url")}
          disabled={isQuickBooks}
        />

        {/* Auth Type */}
        {!isQuickBooks && (
          <select
            className="border p-3 rounded-lg w-full"
            value={form.auth_type}
            onChange={update("auth_type")}
          >
            <option value="NONE">None</option>
            <option value="API_KEY_HEADER">API Key</option>
            <option value="BEARER">Bearer</option>
            <option value="JWT_HS256">JWT (HS256)</option>
          </select>
        )}

        {/* API Key */}
        {isApiKey && !isQuickBooks && (
          <>
            <input
              className="border p-3 rounded-lg w-full"
              type="password"
              placeholder="API Key"
              value={form.api_key}
              onChange={update("api_key")}
            />
            <input
              className="border p-3 rounded-lg w-full"
              placeholder="Header / Query Param"
              value={form.api_key_header}
              onChange={update("api_key_header")}
            />
          </>
        )}

        {/* Bearer */}
        {isBearer && !isQuickBooks && (
          <>
            <input
              className="border p-3 rounded-lg w-full"
              type="password"
              placeholder="Bearer Token"
              value={form.bearer_token}
              onChange={update("bearer_token")}
            />
            <input
              className="border p-3 rounded-lg w-full"
              placeholder="Prefix"
              value={form.bearer_prefix}
              onChange={update("bearer_prefix")}
            />
          </>
        )}

        {/* JWT */}
        {isJWT && (
          <>
            <input
              className="border p-3 rounded-lg w-full"
              type="password"
              placeholder="JWT Secret"
              value={form.jwt_secret}
              onChange={update("jwt_secret")}
            />
            <input
              className="border p-3 rounded-lg w-full"
              placeholder="Subject (sub)"
              value={form.jwt_subject}
              onChange={update("jwt_subject")}
            />
            <input
              className="border p-3 rounded-lg w-full"
              placeholder="Audience (aud)"
              value={form.jwt_audience}
              onChange={update("jwt_audience")}
            />
            <input
              className="border p-3 rounded-lg w-full"
              placeholder="Issuer (iss)"
              value={form.jwt_issuer}
              onChange={update("jwt_issuer")}
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
              className="bg-green-600 text-white py-2 rounded-lg w-full"
            >
              {form.realm_id
                ? "Reconnect QuickBooks"
                : "Connect QuickBooks"}
            </button>

            {form.realm_id && (
              <p className="text-sm text-green-600">
                ✔ Connected to company {form.realm_id}
              </p>
            )}
          </div>
        )}

        <button
          onClick={saveSource}
          disabled={loading}
          className={`py-2 rounded-lg w-full text-white ${
            loading
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : isEdit ? "Update Source" : "Save Source"}
        </button>
      </div>
    </div>
  );
}
