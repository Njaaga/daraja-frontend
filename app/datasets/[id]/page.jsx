"use client";

import { use, useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import DatasetForm from "@/app/components/DatasetForm";
import { apiClient } from "@/lib/apiClient";

export default function Page(props) {
  // ⬅ params is a Promise now — must be unwrapped
  const { id } = use(props.params);

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDataset() {
      try {
        const data = await apiClient(`/api/datasets/${id}/`);
        setDataset(data);
      } catch (error) {
        console.error("Failed to load dataset:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDataset();
  }, [id]);

  if (loading) return <div className="p-10">Loading...</div>;
  if (!dataset) return <div className="p-10 text-red-600">Failed to load dataset.</div>;

  return (
    <Layout>
    <div className="p-10">
      <DatasetForm initialData={dataset} isEdit />
    </div>
    </Layout>
  );
}
