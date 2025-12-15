"use client";

import { useEffect, useState, useMemo } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [search, setSearch] = useState("");
  const [tenant, setTenant] = useState("");

  // Detect tenant from subdomain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname; // e.g., client15.localhost
      setTenant(host.split(".")[0]);
    }
  }, []);

  // Fetch dashboards when tenant is known
  useEffect(() => {
    if (!tenant) return;

    const fetchDashboards = async () => {
      setLoading(true);
      setError("");
      try {
        // Optionally, you could pass tenant in headers if backend requires it
        const data = await apiClient("/api/dashboards/", { tenant });
        if (Array.isArray(data)) {
          setDashboards(data);
        } else {
          setDashboards([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboards");
        if (err.message.includes("401")) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [tenant]);

  // Filter + pagination
  const filtered = useMemo(() => {
    return dashboards.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [dashboards, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedDashboards = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) return <p className="p-6">Loading dashboards...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">📊 Dashboards</h2>
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
        </div>

        {filtered.length === 0 && (
          <p className="text-gray-500 text-lg">No dashboards found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {paginatedDashboards.map((db) => (
            <div
              key={db.id}
              onClick={() => router.push(`/dashboards/${db.id}`)}
              className="bg-white p-6 shadow rounded-xl cursor-pointer hover:shadow-2xl hover:scale-[1.03] transition duration-200"
            >
              <h3 className="text-xl font-bold text-gray-800">{db.name}</h3>
              <p className="text-gray-500 mt-2">
                {db.dashboard_charts?.length || 0} charts
              </p>
              <div className="mt-4 text-right">
                <span className="text-blue-600 text-sm font-semibold">
                  View Dashboard →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
