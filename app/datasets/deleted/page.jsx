"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";

export default function DeletedDatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load deleted datasets
  // -----------------------------
  const loadDeleted = async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/datasets/?show_deleted=true");
      setDatasets(Array.isArray(data) ? data : []);
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
  // Restore dataset
  // -----------------------------
  const restoreDataset = async (id) => {
    try {
      await apiClient(`/api/datasets/${id}/restore/`, { method: "POST" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to restore dataset.");
    }
  };

  // -----------------------------
  // Hard delete dataset
  // -----------------------------
  const hardDelete = async (id) => {
    if (!confirm("Delete dataset permanently?")) return;

    try {
      await apiClient(`/api/datasets/${id}/hard_delete/`, { method: "DELETE" });
      loadDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to delete dataset.");
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
            onClick={() => router.push("/datasets")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to datasets
          </button>
        </div>

        <h1 className="text-2xl font-semibold mb-6">Deleted Datasets</h1>

        {loading && <p className="text-sm text-gray-500 mb-4">Loading…</p>}

        {datasets.length === 0 && !loading ? (
          <div className="text-gray-600">Recycle bin is empty.</div>
        ) : (
          <table className="w-full bg-white shadow rounded-xl">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3">{d.name}</td>
                  <td className="p-3 flex justify-center gap-4">
                    <button
                      onClick={() => restoreDataset(d.id)}
                      className="text-green-600 hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => hardDelete(d.id)}
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
