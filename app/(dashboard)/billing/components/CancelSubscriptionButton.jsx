"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function CancelSubscriptionButton({ onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    const res = await apiClient("/api/subscription/cancel-subscription/", { method: "POST" });
    if (res?.status === "success") onCancel();
    setLoading(false);
  };

  return (
    <button
      onClick={handleCancel}
      className="bg-red-600 text-white px-4 py-2 rounded"
      disabled={loading}
    >
      {loading ? "Cancelling..." : "Cancel Subscription"}
    </button>
  );
}
