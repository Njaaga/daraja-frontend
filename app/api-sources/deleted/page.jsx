"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";

export default function RecycleBin() {
  const [sources, setSources] = useState([]);

  const loadDeleted = async () => {
    try {
      const data = await apiClient("/api/api-sources/?show_deleted=true");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDeleted();
  }, []);

  const restoreSource = async (id) => {
    try {
      await apiClient(`/api/api-sources/${id}/restore/`, { method: "POST" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to restore API source.");
    }
  };

  const hardDelete = async (id) => {
    if (!confirm("Delete permanently?")) return;
    try {
      await apiClient(`/api/api-sources/${id}/hard_delete/`, { method: "DELETE" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to delete API source.");
    }
  };

  return (
    <Layout>
      <div className="p-10">
        <h1 className="text-2xl font-semibold mb-6">Recycle Bin</h1>

        {sources.length === 0 ? (
          <div className="text-gray-600">Recycle bin is empty.</div>
        ) : (
          <table className="w-full bg-white shadow rounded-xl">
            <thead>
              <tr className="border-b text-left text-sm text-gray-600">
                <th className="p-3">Name</th>
                <th className="p-3">Base URL</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">{src.name}</td>
                  <td className="p-3 text-sm text-gray-700 truncate max-w-xs">
                    {src.base_url}
                  </td>
                  <td className="p-3 flex gap-4">
                    <button
                      onClick={() => restoreSource(src.id)}
                      className="text-green-600 hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => hardDelete(src.id)}
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
