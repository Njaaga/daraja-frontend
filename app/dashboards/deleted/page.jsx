"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";

export default function DeletedDashboardsPage() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load deleted dashboards
  // -----------------------------
  const loadDeleted = async () => {
    setLoading(true);
    try {
      // Ensure the backend supports `include_deleted` and returns dashboards with is_deleted=true
      const data = await apiClient(
        "/api/dashboards/?include_deleted=True"
      );
      setDashboards(
        Array.isArray(data)
          ? data.filter((d) => d.is_deleted) // <-- use is_deleted
          : []
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeleted();
  }, []);

  // -----------------------------
  // Restore dashboard
  // -----------------------------
  const restoreDashboard = async (id) => {
    await apiClient(`/api/dashboards/${id}/restore/`, {
      method: "POST",
    });
    loadDeleted();
  };

  // -----------------------------
  // Hard delete dashboard
  // -----------------------------
  const hardDelete = async (id) => {
    if (!confirm("Delete dashboard permanently?")) return;

    await apiClient(`/api/dashboards/${id}/hard_delete/`, {
      method: "DELETE",
    });
    loadDeleted();
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Layout>
      <div className="p-10">
        <h1 className="text-2xl font-semibold mb-6">
          Deleted Dashboards
        </h1>

        {loading && (
          <p className="text-sm text-gray-500 mb-4">Loading…</p>
        )}

        {dashboards.length === 0 && !loading ? (
          <div className="text-gray-600">
            Recycle bin is empty.
          </div>
        ) : (
          <table className="w-full bg-white shadow rounded-xl">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Name</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboards.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3">{d.name}</td>
                  <td className="p-3 flex gap-4">
                    <button
                      onClick={() => restoreDashboard(d.id)}
                      className="text-green-600 hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => hardDelete(d.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete Permanently
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
