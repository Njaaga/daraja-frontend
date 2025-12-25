"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

export default function PackageSelector({ currentPlanId, onSelect }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await apiClient("/api/subscription/plans/");
        setPlans(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    }
    loadPlans();
  }, []);

  const handleSelect = (plan) => {
    if (plan.id === currentPlanId) return; // 🚫 already active
    setSelectedPlanId(plan.id);
    onSelect?.(plan);
  };

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isSelected = plan.id === selectedPlanId;

        return (
          <div
            key={plan.id}
            className={`border rounded p-4 cursor-pointer transition
              ${
                isCurrent
                  ? "border-green-500 bg-green-50 cursor-not-allowed"
                  : isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-gray-100"
              }`}
            onClick={() => handleSelect(plan)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-gray-600">
                  ${plan.price.toFixed(2)} / month
                </div>
              </div>

              {isCurrent && (
                <span className="text-green-600 text-sm font-semibold">
                  Current plan
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
