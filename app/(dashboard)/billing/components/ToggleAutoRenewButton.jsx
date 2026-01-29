"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ToggleAutoRenewButton({ autoRenew, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await apiClient("/api/subscription/toggle-auto-renew/", {
        method: "POST",
      });

      if (res?.status === "success") {
        onToggle(res.auto_renew);
      }
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    "px-4 py-2 rounded font-medium transition-colors duration-200";

  const stateClasses = loading
    ? "bg-gray-400 cursor-not-allowed"
    : autoRenew
    ? "bg-green-600 hover:bg-green-700"
    : "bg-gray-600 hover:bg-gray-700";

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${baseClasses} ${stateClasses} text-white`}
    >
      {loading ? "Updating..." : `Auto-Renew: ${autoRenew ? "ON" : "OFF"}`}
    </button>
  );
}
