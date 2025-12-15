"use client";

import { useEffect, useState, useMemo } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(true);

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Detect tenant from subdomain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname; // e.g., client15.localhost
      setTenant(host.split(".")[0]);
    }
  }, []);

  // Fetch users when tenant is known
  useEffect(() => {
    if (!tenant) return;

    const fetchUsers = async () => {
      setLoading(true);
      setStatus("");

      const data = await apiClient("/api/users/", { tenant });

      if (!data) {
        logout(); // redirect to login if token invalid
        return;
      }

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.warn("API returned non-array users:", data);
        setUsers([]);
      }

      setLoading(false);
    };

    fetchUsers();
  }, [tenant]);

  const inviteUser = async () => {
    if (!firstName || !lastName || !email) {
      setStatus("All fields are required");
      return;
    }

    const data = await apiClient("/api/users/invite/", {
      method: "POST",
      tenant,
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
    });

    if (!data) {
      logout();
      return;
    }

    setStatus(data.message || "Invitation sent");
    setFirstName("");
    setLastName("");
    setEmail("");

    // Refresh user list
    const updatedUsers = await apiClient("/api/users/", { tenant });
    if (Array.isArray(updatedUsers)) setUsers(updatedUsers);
  };

  const deleteUser = async (id) => {
    const res = await apiClient(`/api/users/${id}/`, { method: "DELETE", tenant });
    if (!res) {
      logout();
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Filter + pagination
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <Layout>
      <div className="p-10">
        <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
        {status && <p className="mb-4 text-red-600">{status}</p>}

        {/* Invite User Form */}
        <div className="mb-6 flex flex-col gap-2 w-80">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={inviteUser}
            className="bg-blue-600 text-white p-2 rounded mt-2 hover:bg-blue-700"
          >
            Send Invitation
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded w-80"
          />
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto border rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">First Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Last Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{u.first_name}</td>
                    <td className="px-4 py-2">{u.last_name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
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
