"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, getTenant } from "@/lib/apiClient";

export default function ApiSourceTable() {
  const router = useRouter();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSources() {
      setLoading(true);
      setError(null);

      const tenant = getTenant();
      if (!tenant) {
        // Redirect to login if tenant info is missing
        router.push("/login");
        return;
      }

      try {
        const data = await apiClient("/api/api-sources/");
        if (!data) {
          setError("Failed to fetch API sources. Are you logged in?");
          return;
        }

        if (Array.isArray(data)) {
          setSources(data);
        } else {
          setSources([]);
          console.warn("API response not an array:", data);
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching API sources. Check console for details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSources();
  }, [router]);

  if (loading) return <div className="p-10">Loading API sources...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (sources.length === 0) return <div className="p-10 text-gray-600">No API sources found.</div>;

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">API Data Sources</h2>
        <Link
          href="/api-sources/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add API Source
        </Link>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Base URL</th>
            <th className="p-3">Auth Type</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src) => (
            <tr key={src.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{src.name}</td>
              <td className="p-3">{src.base_url}</td>
              <td className="p-3">{src.auth_type}</td>
              <td className="p-3">
                <Link
                  href={`/api-sources/${src.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
