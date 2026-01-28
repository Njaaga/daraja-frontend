"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Users,
  UsersRound,
  Settings,
  CreditCard,
  LifeBuoy,
  Trash2,
} from "lucide-react";


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

export default function ApiSourcesPage() {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------
  // Load API sources
  // -----------------------------
  const loadSources = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const data = await apiClient("/api/api-sources/");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading API sources:", err);
      setError("Failed to load API sources.");
      setSources([]);
    } finally {
      setRefreshing(false);
    }
  };

  // -----------------------------
  // Initial load
  // -----------------------------
  useEffect(() => {
    loadSources();
  }, []);

  // -----------------------------
  // Delete source (JS version)
  // -----------------------------
  const deleteSource = async (id) => {
    if (!confirm("Move API source to recycle bin?")) return;
    await apiClient(`/api/api-sources/${id}/`, { method: "DELETE" });
    loadSources();
  };

  return (
      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between mb-6 items-center">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database  size={24} />
            API Data Sources
          </h2>


          <div className="flex items-center gap-4">
            {refreshing && (
              <span className="text-sm text-gray-500">Refreshing…</span>
            )}

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
              <Trash2 size={20} />
              Recycle Bin
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Empty state */}
        {sources.length === 0 && !error ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-600">
            No API sources found.
          </div>
        ) : (
          <div className="bg-white shadow rounded-xl p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Base URL</th>
                  <th className="p-3">Auth</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sources.map((src) => (
                  <tr
                    key={src.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{src.name}</td>

                    <td className="p-3 text-sm text-gray-700 truncate max-w-xs">
                      {src.base_url}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          AUTH_BADGE_STYLES[src.auth_type] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {AUTH_LABELS[src.auth_type] || src.auth_type}
                      </span>
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/api-sources/${src.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => deleteSource(src.id)}
                        className="text-red-600 hover:underline ml-3"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
