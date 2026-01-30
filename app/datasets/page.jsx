"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import InfoTooltip from "@/app/components/InfoTooltip";
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


export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------
  // Load datasets (silent)
  // -----------------------------
  const loadDatasets = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const data = await apiClient("/api/datasets/");

      if (Array.isArray(data)) {
        setDatasets(data);
      } else if (Array.isArray(data?.results)) {
        setDatasets(data.results);
      } else {
        setDatasets([]);
      }
    } catch (err) {
      console.error("Error loading datasets:", err);
      setError("Failed to load datasets.");
      setDatasets([]);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteDataset = async (id) => {
    if (!confirm("Move dataset to recycle bin?")) return;

    await apiClient(`/api/datasets/${id}/`, { method: "DELETE" });
    loadDatasets();
  };


  // -----------------------------
  // Initial load
  // -----------------------------
  useEffect(() => {
    loadDatasets();
  }, []);

  return (
    <Layout>
      <div className="p-10">
        <div className="flex justify-between mb-6 items-center">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 size={24} />
                Datasets
              </h2>
              <InfoTooltip
                align="right"
                text="combines an API Source with an endpoint, parameters, and parsing rules to produce chart-ready data."
              />
            </div>


          <div className="flex items-center gap-4">
            {refreshing && (
              <span className="text-sm text-gray-500">Refreshing…</span>
            )}

            <Link
              href="/datasets/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + New Dataset
            </Link>
            <Link
              href="/datasets/deleted"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <Trash2 size={20} />
              <span>Recycle Bin</span>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Empty state */}
        {datasets.length === 0 && !error ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-600">
            No datasets found.
          </div>
        ) : (
          <div className="bg-white shadow rounded-xl p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">API Source</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{d.name}</td>
                    <td className="p-3">{d.api_source_name}</td>
                    <td className="p-3">{d.endpoint}</td>
                    <td className="p-3">
                      <Link
                        href={`/datasets/${d.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteDataset(d.id)}
                        className="text-red-600 hover:underline ml-3"
                      >
                        Delete
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
