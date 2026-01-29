"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import SubscriptionGate from "@/app/components/SubscriptionGate";
import Link from "next/link";
import * as XLSX from "xlsx";
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


const STATUS = {
  SUCCESS: "success",
  ERROR: "error",
};

export default function UsersPage() {
  const router = useRouter();

  // Data
  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState("");

  // Invite form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // UI state
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
  // Load users
  // -----------------------------
  const loadUsers = async () => {
    if (!tenant) return;

    setRefreshing(true);
    try {
      const data = await apiClient("/api/users/", { tenant });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      router.push("/login");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [tenant]);

  // -----------------------------
  // Invite single user
  // -----------------------------
  const inviteUser = async () => {
    if (!firstName || !lastName || !email) {
      setStatus({
        message: "All fields are required",
        type: STATUS.ERROR,
      });
      return;
    }

    try {
      const res = await apiClient("/api/users/invite/", {
        method: "POST",
        tenant,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
        }),
      });

      setStatus({
        message: res?.message || "User invited successfully",
        type: STATUS.SUCCESS,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      loadUsers();
    } catch (err) {
      setStatus({
        message: "Failed to invite user",
        type: STATUS.ERROR,
      });
    }
  };

  // -----------------------------
  // Bulk invite via Excel
  // -----------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const validUsers = sheet.filter(
        (r) => r.first_name && r.last_name && r.email
      );

      if (validUsers.length === 0) {
        setStatus({
          message: "No valid users found in the Excel file",
          type: STATUS.ERROR,
        });
        return;
      }

      const res = await apiClient("/api/users/bulk_invite/", {
        method: "POST",
        tenant,
        body: JSON.stringify({ users: validUsers }),
      });

      setStatus({
        message: res?.message || "Users invited successfully",
        type: STATUS.SUCCESS,
      });

      loadUsers();
    } catch (err) {
      console.error(err);
      setStatus({
        message: "Failed to upload users",
        type: STATUS.ERROR,
      });
    }
  };

  // -----------------------------
  // Soft delete
  // -----------------------------
  const deleteUser = async (id) => {
    try {
      if (!confirm("Move user to recycle bin?")) return;
      await apiClient(`/api/users/${id}/`, {
        method: "DELETE",
        tenant,
      });

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setStatus({
        message: "Failed to delete user",
        type: STATUS.ERROR,
      });
    }
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
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users size={24} />
              Users
            </h2>

            <Link
              href="/admin/users/deleted"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <Trash2 size={20} />
              <span>Recycle Bin</span>
            </Link>
          </div>

          {/* Status message */}
          {status?.message && (
            <div
              className={`mb-4 p-3 rounded border ${
                status.type === STATUS.ERROR
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Invite single user */}
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

          {/* Excel upload */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">
              Upload Users via Excel:
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="p-2 border rounded"
            />
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
