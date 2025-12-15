"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import Layout from "@/app/components/Layout";
import { useParams } from "next/navigation";
import ApiSourceForm from "@/app/components/ApiSourceForm";
import { apiClient } from "@/lib/apiClient";

export default function Page() {
  const params = useParams();
  const { id } = params;
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSource() {
      const data = await apiClient(`/api/api-sources/${id}/`);
      setInitialData(data);
      setLoading(false);
    }
    fetchSource();
  }, [id]);

  if (loading) return <div className="p-10">Loading API source...</div>;
  if (!initialData) return <div className="p-10 text-red-600">Failed to load API source</div>;

  return (
    <Layout>
    <div className="p-10">
      <ApiSourceForm initialData={initialData} isEdit />
    </div>
    </Layout>
  );
}
