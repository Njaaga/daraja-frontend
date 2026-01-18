"use client";

import { useEffect, useState, useMemo } from "react";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";

export default function DashboardsPage() {
  const router = useRouter();

  // -----------------------------
  // State
  // -----------------------------
  const [dashboards, setDashboards] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState("");

  // Table state
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [search, setSearch] = useState("");

  // -----------------------------
  // Detect tenant
  // -----------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setTenant(host.split(".")[0]);
    }
  }, []);

  // -----------------------------
  // Load dashboards
  // -----------------------------
  const loadDashboards = async () => {
    if (!tenant) return;

    setRefreshing(true);
    setError(null);

    try {
      const data = await apiClient("/api/dashboards/", { tenant });
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load dashboards:", err);
      setError("Failed to load dashboards");
      router.push("/login");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenant) loadDashboards();
  }, [tenant]);

  // -----------------------------
  // Soft delete dashboard
  // -----------------------------
  const deleteDashboard = async (id) => {
    if (!confirm("Move this dashboard to the recycle bin?")) return;

    try {
      await apiClient(`/api/dashboards/${id}/`, {
        method: "DELETE",
        tenant,
      });
      loadDashboards();
    } catch (err) {
      console.error("Failed to delete dashboard:", err);
      alert("Failed to delete dashboard");
    }
  };

  // -----------------------------
  // Filter + pagination
  // -----------------------------
  const filteredDashboards = useMemo(() => {
    return dashboards.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [dashboards, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDashboards.length / pageSize)
  );

  const paginatedDashboards = filteredDashboards.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">📊 Dashboards</h2>
            {refreshing && (
              <p className="text-sm text-gray-500">Refreshing…</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search dashboards..."
              className="border rounded px-3 py-2 w-64"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />

            {/* Recycle Bin Link */}
            <Link
              href="/dashboards/deleted"
              className="text-sm text-red-600 font-semibold hover:underline"
            >
              ♻️ Recycle Bin
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Empty */}
        {filteredDashboards.length === 0 && !refreshing ? (
          <p className="text-gray-500 text-lg">No dashboards found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {paginatedDashboards.map((db) => (
              <div
                key={db.id}
                onClick={() => router.push(`/dashboards/${db.id}`)}
                className="relative bg-white p-6 shadow rounded-xl cursor-pointer hover:shadow-2xl hover:scale-[1.03] transition duration-200"
              >
                <h3 className="text-xl font-bold text-gray-800">
                  {db.name}
                </h3>

                <p className="text-gray-500 mt-2">
                  {db.dashboard_charts?.length || 0} charts
                </p>

                <div className="mt-6 flex justify-between items-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    View Dashboard →
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent navigation
                      deleteDashboard(db.id);
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
