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
    if (plan.id === currentPlanId) return;
    setSelectedPlanId(plan.id);
    onSelect?.(plan);
  };
useEffect(() => {
  console.log("Plans from API:", plans);
}, [plans]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isSelected = plan.id === selectedPlanId;

        return (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 shadow-sm bg-white flex flex-col transition
              ${
                isCurrent
                  ? "border-green-600 ring-2 ring-green-200"
                  : isSelected
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "hover:shadow-md cursor-pointer"
              }
            `}
            onClick={() => handleSelect(plan)}
          >
            {/* Plan header */}
            <h3 className="text-xl font-semibold">{plan.name}</h3>

            {/* Price */}
            <div className="mt-4">
              <span className="text-3xl font-bold">
                ${plan.price.toFixed(2)}
              </span>
              <span className="text-gray-500"> / month</span>
            </div>

            {/* Features */}
            {Array.isArray(plan.features) && (
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <div className="mt-auto pt-6">
              {isCurrent ? (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-600 py-2 rounded"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  {isSelected ? "Selected" : "Select Plan"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
