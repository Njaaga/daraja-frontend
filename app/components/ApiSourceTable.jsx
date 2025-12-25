"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

const AUTH_LABELS = {
  NONE: "None",
  API_KEY_HEADER: "API Key (Header)",
  API_KEY_QUERY: "API Key (Query)",
  BEARER: "Bearer Token",
  JWT_HS256: "JWT (HS256)",
};

const AUTH_BADGE_STYLES = {
  NONE: "bg-gray-100 text-gray-700",
  API_KEY_HEADER: "bg-blue-100 text-blue-700",
  API_KEY_QUERY: "bg-blue-100 text-blue-700",
  BEARER: "bg-purple-100 text-purple-700",
  JWT_HS256: "bg-green-100 text-green-700",
};

export default function ApiSourceTable() {
  const router = useRouter();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient("/api/api-sources/");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Error fetching API sources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const deleteSource = async (id) => {
    if (!confirm("Are you sure you want to delete this API source?")) return;
    try {
      // 🔹 Call DELETE to soft-delete
      await apiClient(`/api/api-sources/${id}/`, { method: "DELETE" });
      fetchSources();
    } catch (err) {
      console.error(err);
      alert("Failed to delete API source.");
    }
  };

  if (loading) return <div className="p-10">Loading API sources...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (sources.length === 0)
    return <div className="p-10 text-gray-600">No API sources found.</div>;

  return (
    <AuthGuard>
      <div className="p-6 bg-white rounded-2xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Data Sources</h2>
          <div className="flex gap-2">
            <Link
              href="/api-sources/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add API Source
            </Link>
            <Link
              href="/api-sources/deleted"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Recycle Bin
            </Link>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-sm text-gray-600">
              <th className="p-3">Name</th>
              <th className="p-3">Base URL</th>
              <th className="p-3">Auth</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src) => (
              <tr key={src.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{src.name}</td>
                <td className="p-3 text-sm text-gray-700 truncate max-w-xs">{src.base_url}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      AUTH_BADGE_STYLES[src.auth_type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {AUTH_LABELS[src.auth_type] || src.auth_type}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <Link
                    href={`/api-sources/${src.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteSource(src.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthGuard>
  );
}
