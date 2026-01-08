"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import SubscriptionGate from "@/app/components/SubscriptionGate";
import Link from "next/link";

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState("");

  // Invite form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // UI
  const [status, setStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Table
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // -----------------------------
  // Tenant detection
  // -----------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTenant(window.location.hostname.split(".")[0]);
    }
  }, []);

  // -----------------------------
  // Load active users only
  // -----------------------------
  const loadUsers = async () => {
    if (!tenant) return;

    setRefreshing(true);
    try {
      const data = await apiClient("/api/users/", { tenant });
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      router.push("/login");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [tenant]);

  // -----------------------------
  // Invite user
  // -----------------------------
  const inviteUser = async () => {
    if (!firstName || !lastName || !email) {
      setStatus("All fields are required");
      return;
    }

    try {
      const res = await apiClient("/api/users/invite/", {
        method: "POST",
        tenant, // ✅ THIS is what your apiClient expects
        body: {
          first_name: firstName,
          last_name: lastName,
          email,
        },
      });


      setStatus(res?.message || "Invitation sent");
      setFirstName("");
      setLastName("");
      setEmail("");
      loadUsers();
    } catch {
      router.push("/login");
    }
  };

  // -----------------------------
  // Soft delete
  // -----------------------------
  const deleteUser = async (id) => {
    await apiClient(`/api/users/${id}/`, {
      method: "DELETE",
      tenant,
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
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
            <h2 className="text-2xl font-bold">Users</h2>
            <Link
              href="/admin/users/deleted"
              className="text-sm text-blue-600 hover:underline"
            >
              Recycle Bin
            </Link>
          </div>

          {status && <p className="mb-4 text-red-600">{status}</p>}

          {/* Invite */}
          <div className="mb-6 flex flex-col gap-2 w-80">
            <input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={inviteUser}
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Send Invitation
            </button>
          </div>

          {/* Search */}
          <input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded mb-4 w-80"
          />

          {/* Table */}
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
                      No users found
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
                          onClick={() => deleteUser(u.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Delete
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
