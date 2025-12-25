"use client";

import Layout from "@/app/components/Layout";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";

export default function DeletedGroupsPage() {
  const [tenant, setTenant] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTenant(window.location.hostname.split(".")[0]);
    }
  }, []);

  const loadDeleted = async () => {
    const data = await apiClient("/api/groups/?recycle=true", { tenant });
    setGroups(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (tenant) loadDeleted();
  }, [tenant]);

  const restoreGroup = async (id) => {
    await apiClient(`/api/groups/${id}/restore/`, {
      method: "POST",
      tenant,
    });
    loadDeleted();
  };

  const hardDeleteGroup = async (id) => {
    if (!confirm("Permanently delete this group?")) return;

    await apiClient(`/api/groups/${id}/hard_delete/`, {
      method: "DELETE",
      tenant,
    });
    loadDeleted();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deleted Groups</h1>
        <Link href="/admin/groups" className="underline">
          Back to Groups
        </Link>
      </div>

      {groups.length === 0 && (
        <p className="text-gray-500">No deleted groups</p>
      )}

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
    </Layout>
  );
}
