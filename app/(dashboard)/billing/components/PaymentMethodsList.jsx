"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function PaymentMethodsList({ methods, onUpdated }) {
  const [loadingId, setLoadingId] = useState(null); // track loading per card

  if (!Array.isArray(methods) || methods.length === 0) {
    return <p className="text-gray-500">No payment methods added.</p>;
  }

  const setAsDefault = async (paymentMethodId) => {
    setLoadingId(paymentMethodId);
    try {
      await apiClient("/api/subscription/set-default-payment-method/", {
        method: "POST",
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      onUpdated?.();
    } catch (err) {
      console.error("Failed to set default:", err);
      alert("Failed to set default payment method");
    } finally {
      setLoadingId(null);
    }
  };

  const deletePaymentMethod = async (paymentMethodId, isDefault) => {
    if (isDefault) {
      alert("Cannot delete default payment method. Set another card as default first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this card?")) return;

    setLoadingId(paymentMethodId);
    try {
      await apiClient("/api/subscription/delete-payment-method/", {
        method: "POST",
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      onUpdated?.();
    } catch (err) {
      console.error("Failed to delete card:", err);
      alert("Failed to delete payment method");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <ul className="space-y-3">
      {methods.map((pm) => {
        const isDefault = pm.is_default === true;
        const isLoading = loadingId === pm.id;

        return (
          <li
            key={pm.id}
            className={`flex items-center justify-between border p-3 rounded ${
              isDefault ? "border-green-500 bg-green-50" : ""
            }`}
          >
            <div>
              <div className="font-medium">
                {pm.brand.toUpperCase()} **** {pm.last4}
              </div>
              <div className="text-sm text-gray-500">
                Exp {pm.exp_month}/{pm.exp_year}
              </div>

              {isDefault && (
                <div className="text-green-600 text-sm font-semibold mt-1">
                  Default payment method
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isDefault && (
                <button
                  onClick={() => setAsDefault(pm.id)}
                  disabled={isLoading}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  {isLoading ? "..." : "Set as default"}
                </button>
              )}

              <button
                onClick={() => deletePaymentMethod(pm.id, isDefault)}
                disabled={isLoading}
                className="text-red-600 text-sm font-medium hover:underline"
              >
                {isLoading ? "..." : "Delete"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
