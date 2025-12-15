"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

export default function PackageSelector({ onSelect }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    async function loadPlans() {
      const res = await apiClient("/api/subscription/plans/");
      setPlans(Array.isArray(res) ? res : []);
    }
    loadPlans();
  }, []);

  return (
    <div className="space-y-2">
      {plans.map((plan) => (
        <button
          key={plan.id}
          className="border px-4 py-2 rounded hover:bg-gray-100"
          onClick={() => onSelect(plan)}
        >
          {plan.name} - ${(plan.price / 100).toFixed(2)}
        </button>
      ))}
    </div>
  );
}
