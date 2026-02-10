"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getTenant } from "@/lib/apiClient";

export default function ApiSourceForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const tenant = getTenant();

  const [form, setForm] = useState(
    initialData || {
      id: null,
      name: "",
      provider: "generic",
      auth_type: "NONE",
      base_url: "",
      realm_id: null, // for QuickBooks
      api_key: "",
      api_key_header: "Authorization",
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

  const isQuickBooks = form.provider === "quickbooks";
  const isApiKey =
    form.auth_type === "API_KEY_HEADER" || form.auth_type === "API_KEY_QUERY";
  const isJWT = form.auth_type === "JWT_HS256";
  const isBearer = form.auth_type === "BEARER";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const saveSource = async () => {
    if (!tenant || loading) return;

    setLoading(true);
    setError(null);

    try {
      // QuickBooks is handled separately
      if (!isQuickBooks) {
        const url = isEdit
          ? `/api/api-sources/${form.id}/`
          : `/api/api-sources/`;

        const method = isEdit ? "PUT" : "POST";
        const payload = { ...form };

        if (!payload.api_key) delete payload.api_key;
        if (!payload.jwt_secret) delete payload.jwt_secret;
        if (!payload.bearer_token) delete payload.bearer_token;

        await apiClient(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, tenant);

        router.push("/api-sources");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save API source");
    } finally {
      setLoading(false);
    }
  };

  const connectQuickBooks = () => {
    if (!tenant) {
      alert("Tenant not set. Refresh page.");
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    window.location.href = `${apiBase}/api/oauth/quickbooks/connect/?state=${tenant}`;
  };

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

        {/* Provider */}
        <select
          className="border p-3 rounded-lg w-full"
          value={form.provider}
          onChange={handleChange}
          name="provider"
        >
          <option value="generic">Generic API</option>
          <option value="quickbooks">QuickBooks Online</option>
        </select>

        {/* Name */}
        <input
          name="name"
          className="border p-3 rounded-lg w-full"
          placeholder="Name"
          value={isQuickBooks ? "QuickBooks Online" : form.name}
          onChange={handleChange}
          disabled={isQuickBooks}
        />

        {/* Base URL */}
        <input
          className="border p-3 rounded-lg w-full bg-gray-100"
          value={
            isQuickBooks
              ? form.realm_id
                ? `https://quickbooks.api.intuit.com/v3/company/${form.realm_id}`
                : "https://quickbooks.api.intuit.com/v3/company/{realm_id}"
              : form.base_url
          }
          disabled
        />

        {/* QuickBooks OAuth */}
        {isQuickBooks && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={connectQuickBooks}
              className="bg-green-600 text-white py-2 rounded-lg w-full hover:bg-green-700"
            >
              {form.realm_id ? "Reconnect QuickBooks" : "Connect QuickBooks"}
            </button>

            {form.realm_id && (
              <p className="text-sm text-green-700">
                ✔ Connected to company ID {form.realm_id}
              </p>
            )}

            <p className="text-xs text-gray-500">
              You’ll be redirected to Intuit to authorize access.
            </p>
          </div>
        )}

        {/* Save Button */}
        {!isQuickBooks && (
          <button
            onClick={saveSource}
            disabled={loading}
            className={`py-2 rounded-lg w-full text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : isEdit ? "Update Source" : "Save Source"}
          </button>
        )}
      </div>
    </div>
  );
}
