"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Wrapper required for useSearchParams
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

  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("generic");

  // Example: how you already store tenant
  const tenant =
    typeof window !== "undefined"
      ? localStorage.getItem("tenant")
      : null;

  /**
   * Detect QuickBooks return
   */
  useEffect(() => {
    if (searchParams.get("qb_connected")) {
      router.push("/api-sources");
    }
  }, [searchParams, router]);

  /**
   * Start QuickBooks OAuth
   */
  const connectQuickBooks = () => {
    if (!tenant) {
      alert("Tenant missing");
      return;
    }

    setLoading(true);

    window.location.href =
      `${process.env.NEXT_PUBLIC_API_BASE_URL}` +
      `/api/oauth/quickbooks/connect?tenant=${tenant}`;
  };

  /**
   * Generic API submit (unchanged behavior)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/api-sources/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Slug": tenant, // ✅ still works
          },
          body: JSON.stringify({
            name: "My API",
            provider: "generic",
            base_url: "https://example.com",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create API source");

      router.push("/api-sources");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save API Source"}
          </button>
        </form>
      )}
    </div>
  );
}
