"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import { apiClient } from "@/lib/apiClient";

export default function DeletedDatasetsPage() {
  const [datasets, setDatasets] = useState([]);

  const loadDeleted = async () => {
    const data = await apiClient("/api/datasets/?show_deleted=true");
    setDatasets(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadDeleted();
  }, []);

  const restoreDataset = async (id) => {
    await apiClient(`/api/datasets/${id}/restore/`, { method: "POST" });
    loadDeleted();
  };

  const hardDelete = async (id) => {
    if (!confirm("Delete permanently?")) return;
    await apiClient(`/api/datasets/${id}/hard_delete/`, { method: "DELETE" });
    loadDeleted();
  };

  return (
    <Layout>
      <div className="p-10">
        <h1 className="text-2xl font-semibold mb-6">Deleted Datasets</h1>

        {datasets.length === 0 ? (
          <div className="text-gray-600">Recycle bin is empty.</div>
        ) : (
          <table className="w-full bg-white shadow rounded-xl">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Name</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3">{d.name}</td>
                  <td className="p-3 flex gap-4">
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
