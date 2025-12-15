"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ToggleAutoRenewButton({ autoRenew, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const res = await apiClient("/api/subscription/toggle-auto-renew/", { method: "POST" });
    if (res?.status === "success") onToggle(res.auto_renew);
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      className="bg-gray-600 text-white px-4 py-2 rounded"
      disabled={loading}
    >
      {loading ? "Updating..." : `Auto-Renew: ${autoRenew ? "ON" : "OFF"}`}
    </button>
  );
}
