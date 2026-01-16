"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";
import Layout from "@/app/components/Layout";

export default function RecycleBin() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

const fetchDeleted = async () => {
  setLoading(true);
  try {
    // ✅ Fetch deleted items
    const data = await apiClient("/api/api-sources/?show_deleted=true");
    setSources(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDeleted();
  }, []);

const restoreSource = async (id) => {
  try {
    await apiClient(`/api/api-sources/${id}/restore/`, { method: "POST" });
    fetchDeleted(); // refresh the Recycle Bin
  } catch (err) {
    console.error(err);
    alert("Failed to restore API source.");
  }
};

  const hardDelete = async (id) => {
    if (!confirm("Delete permanently?")) return;
    await apiClient(`/api/api-sources/${id}/hard_delete/`, { method: "DELETE" });
    loadDeleted();
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!sources.length) return <div className="p-10 text-gray-600">Recycle bin is empty.</div>;

  return (
    <Layout>
    <AuthGuard>
      <div className="p-6 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Recycle Bin</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-sm text-gray-600">
              <th className="p-3">Name</th>
              <th className="p-3">Base URL</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src) => (
              <tr key={src.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{src.name}</td>
                <td className="p-3 text-sm text-gray-700 truncate max-w-xs">{src.base_url}</td>
                <td className="p-3">
                  <button
                    onClick={() => restoreSource(src.id)}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
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
      </div>
    </AuthGuard>
    </Layout>
  );
}
