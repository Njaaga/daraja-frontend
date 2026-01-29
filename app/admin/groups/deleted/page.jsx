"use client";

import Layout from "@/app/components/Layout";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function DeletedGroupsPage() {
  const [tenant, setTenant] = useState("");
  const [groups, setGroups] = useState([]);

  // Detect tenant
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTenant(window.location.hostname.split(".")[0]);
    }
  }, []);

  // Load deleted groups
  const loadDeleted = async () => {
    if (!tenant) return;
    try {
      const data = await apiClient("/api/groups/?recycle=true", { tenant });
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tenant) loadDeleted();
  }, [tenant]);

  // Restore
  const restoreGroup = async (id) => {
    if (!confirm("Restore this group?")) return;
    try {
      await apiClient(`/api/groups/${id}/restore/`, { method: "POST", tenant });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to restore group.");
    }
  };

  // Hard delete
  const hardDeleteGroup = async (id) => {
    if (!confirm("Permanently delete this group?")) return;
    try {
      await apiClient(`/api/groups/${id}/hard_delete/`, { method: "DELETE", tenant });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to delete group.");
    }
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Back button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => window.location.href = "/admin/groups"}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Groups
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">Deleted Groups</h1>

        {groups.length === 0 ? (
          <p className="text-gray-500">No deleted groups</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-red-50 border border-red-200 p-4 rounded shadow"
              >
                <p className="font-bold mb-3">{g.name}</p>

                <div className="flex justify-between">
                  <button
                    onClick={() => restoreGroup(g.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => hardDeleteGroup(g.id)}
                    className="bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
