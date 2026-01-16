"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import SubscriptionGate from "@/app/components/SubscriptionGate";
import Link from "next/link";

export default function UsersRecycleBinPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Table
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // -----------------------------
  // Tenant
  // -----------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTenant(window.location.hostname.split(".")[0]);
    }
  }, []);

  // -----------------------------
  // Load deleted users
  // -----------------------------
  const loadDeletedUsers = async () => {
    if (!tenant) return;

    setRefreshing(true);
    try {
      const data = await apiClient(
        "/api/users/?include_deleted=true",
        { tenant }
      );

      setUsers(
        Array.isArray(data)
          ? data.filter((u) => !u.is_active)
          : []
      );
    } catch {
      router.push("/login");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeletedUsers();
  }, [tenant]);

  // -----------------------------
  // Restore
  // -----------------------------
  const restoreUser = async (id) => {
    await apiClient(`/api/users/${id}/restore/`, {
      method: "POST",
      tenant,
    });
    loadDeletedUsers();
  };

  // -----------------------------
  // Filtering & pagination
  // -----------------------------
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <SubscriptionGate>
      <Layout>
        <div className="p-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">User Recycle Bin</h2>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Users
            </Link>
          </div>

          {refreshing && (
            <p className="text-sm text-gray-500 mb-2">Refreshing…</p>
          )}

          <input
            placeholder="Search deleted users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded mb-4 w-80"
          />

          <div className="border rounded overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">First</th>
                  <th className="px-4 py-2 text-left">Last</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      Recycle bin is empty
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{u.first_name}</td>
                      <td className="px-4 py-2">{u.last_name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => restoreUser(u.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Restore
                        </button>
                        <button
                        onClick={() => hardDelete(u.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete Permanently
                      </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="border px-3 py-1 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border px-3 py-1 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Layout>
    </SubscriptionGate>
  );
}
