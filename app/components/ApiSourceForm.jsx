"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Wrapper required by Next.js
 */
export default function APISourceForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <APISourceFormInner />
    </Suspense>
  );
}

function APISourceFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [provider, setProvider] = useState("generic");
  const [loading, setLoading] = useState(false);

  /**
   * 🔑 IMPORTANT:
   * Reuse how your app already gets tenant
   */
  const getTenant = () => {
    // CHANGE ONLY THIS if needed
    return (
      localStorage.getItem("tenant_slug") ||
      localStorage.getItem("activeTenant") ||
      localStorage.getItem("currentTenant")
    );
  };

  const tenant = getTenant();

  useEffect(() => {
    if (searchParams.get("qb_connected")) {
      router.push("/api-sources");
    }
  }, [searchParams, router]);

  const connectQuickBooks = () => {
    if (!tenant) {
      console.error("Tenant missing in frontend");
      alert("Tenant not detected. Please reload the app.");
      return;
    }

    setLoading(true);

    window.location.href =
      `${process.env.NEXT_PUBLIC_API_BASE_URL}` +
      `/api/oauth/quickbooks/connect?tenant=${encodeURIComponent(tenant)}`;
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Add API Source</h1>

      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="w-full border p-2"
      >
        <option value="generic">Generic API</option>
        <option value="quickbooks">QuickBooks Online</option>
      </select>

      {provider === "quickbooks" ? (
        <button
          onClick={connectQuickBooks}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Connecting..." : "Connect QuickBooks"}
        </button>
      ) : (
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => router.push("/api-sources")}
        >
          Save API Source
        </button>
      )}
    </div>
  );
}
