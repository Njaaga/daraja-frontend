"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import Link from "next/link";
import axiosClient from "@/utils/axiosClient"; // axios instance with refresh

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const fetchDashboards = async () => {
    try {
      const res = await axiosClient.get("/dashboards/");
      setDashboards(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboards");
    }
  };

  const createDashboard = async () => {
    if (!newName.trim()) {
      setError("Dashboard name is required");
      return;
    }

    try {
      await axiosClient.post("/dashboards/", { name: newName });
      setNewName("");
      fetchDashboards();
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to create dashboard");
    }
  };

  const deleteDashboard = async (id) => {
    try {
      await axiosClient.delete(`/dashboards/${id}/`);
      fetchDashboards();
    } catch (err) {
      console.error(err);
      setError("Failed to delete dashboard");
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  return (
    <Layout>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboards</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Create Dashboard */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="New Dashboard Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border rounded p-2 w-64"
        />
        <button
          onClick={createDashboard}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>

      {/* Dashboard Cards */}
      {dashboards.length === 0 ? (
        <p>No dashboards found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dashboards.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col justify-between hover:shadow-xl transition"
            >
              <div>
                <Link
                  href={`/dashboards/${d.id}`}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {d.name}
                </Link>
                {d.description && (
                  <p className="text-gray-600 text-sm mt-1">{d.description}</p>
                )}
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={() => deleteDashboard(d.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
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
