"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";

export default function RecycleBin() {
  const router = useRouter();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load deleted API sources
  // -----------------------------
  const loadDeleted = async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/api-sources/?show_deleted=true");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeleted();
  }, []);

  // -----------------------------
  // Restore API source
  // -----------------------------
  const restoreSource = async (id) => {
    if (!confirm("Restore this API source?")) return;

    try {
      await apiClient(`/api/api-sources/${id}/restore/`, { method: "POST" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to restore API source.");
    }
  };

  // -----------------------------
  // Hard delete API source
  // -----------------------------
  const hardDelete = async (id) => {
    if (!confirm("Delete this API source permanently?")) return;

    try {
      await apiClient(`/api/api-sources/${id}/hard_delete/`, { method: "DELETE" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to delete API source.");
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Layout>
      <div className="p-10">
        {/* Back button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/api-sources")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to API sources
          </button>
        </div>

        <h1 className="text-2xl font-semibold mb-6">Recycle Bin</h1>

        {loading && <p className="text-sm text-gray-500 mb-4">Loading…</p>}

        {sources.length === 0 && !loading ? (
          <div className="text-gray-600">Recycle bin is empty.</div>
        ) : (
          <table className="w-full bg-white shadow rounded-xl">
            <thead>
              <tr className="border-b text-left text-sm text-gray-600">
                <th className="p-3">Name</th>
                <th className="p-3">Base URL</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">{src.name}</td>
                  <td className="p-3 text-sm text-gray-700 truncate max-w-xs">
                    {src.base_url}
                  </td>
                  <td className="p-3 flex justify-center gap-4">
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
