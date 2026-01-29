"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import SubscriptionGate from "@/app/components/SubscriptionGate";
import PackageSelector from "./components/PackageSelector";
import PaymentMethodsList from "./components/PaymentMethodsList";
import InvoicesList from "./components/InvoicesList";
import CancelSubscriptionButton from "./components/CancelSubscriptionButton";
import ToggleAutoRenewButton from "./components/ToggleAutoRenewButton";
import AddCardForm from "./components/AddCardForm";
import { apiClient, getTenant } from "@/lib/apiClient";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  const tenant = getTenant();

  const [tenantMissing, setTenantMissing] = useState(!tenant);
  const [refreshing, setRefreshing] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [usage, setUsage] = useState(null);
  const [limits, setLimits] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);

  // ---------------------------------------
  // Load billing data (DEFENSIVE)
  // ---------------------------------------
  const loadBillingData = async () => {
    if (!tenant) return;

    setRefreshing(true);
    setTenantMissing(false);

    try {
      const subRes = await apiClient("/api/subscription/status/");
      setSubscription(subRes?.current_plan || null);
    } catch (e) {
      console.warn("Subscription status failed", e);
    }

    try {
      const pmRes = await apiClient("/api/subscription/list-payment-methods/");
      setPaymentMethods(pmRes || []);
    } catch (e) {
      console.warn("Payment methods failed", e);
    }

    try {
      const invRes = await apiClient("/api/subscription/list-invoices/");
      setInvoices(invRes || []);
    } catch (e) {
      console.warn("Invoices failed", e);
    }

    try {
      const usageRes = await apiClient("/api/subscription/usage/");
      setUsage(usageRes?.usage || {});
      setLimits(usageRes?.limits || {});
    } catch (e) {
      console.warn("Usage failed", e);
    }

    setRefreshing(false);
  };

  // ---------------------------------------
  // Initial load
  // ---------------------------------------
  useEffect(() => {
    if (tenant) loadBillingData();
    else setTenantMissing(true);
  }, [tenant]);

  // ---------------------------------------
  // Actions
  // ---------------------------------------
  const handleChangePlan = async (planId) => {
    try {
      const res = await apiClient("/api/subscription/change-plan/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });

      if (res.status === "success") {
        await loadBillingData();
      } else {
        alert(res.error || "Failed to change plan");
      }
    } catch {
      alert("Failed to change plan");
    }
  };

  const handleCheckout = async (planId) => {
    if (!planId || !tenant) return;

    try {
      const res = await apiClient(
        "/api/subscription/create-checkout-session/",
        {
          method: "POST",
          body: JSON.stringify({ plan_id: planId }),
        }
      );

      if (res?.url) window.location.href = res.url;
      else throw new Error();
    } catch {
      alert("Checkout failed");
    }
  };

  // ---------------------------------------
  // Tenant missing
  // ---------------------------------------
  if (tenantMissing) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} />
            Billing
          </h2>
          <p className="text-red-600 mt-4">
            Tenant not detected. Please log in again.
          </p>
        </div>
      </Layout>
    );
  }

  // ---------------------------------------
  // Render
  // ---------------------------------------
  return (
    <SubscriptionGate>
      <Layout>
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} />
            Billing
          </h2>

          {refreshing && (
            <p className="text-sm text-gray-500">
              Refreshing billing data…
            </p>
          )}

          {/* Usage */}
          {usage && limits && (
            <div className="border p-4 rounded bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Usage</h3>
              <ul className="space-y-1 text-sm">
                {Object.keys(usage).map((key) => (
                  <li key={key} className="flex justify-between">
                    <span className="capitalize">{key}</span>
                    <span>
                      {usage[key]}{" "}
                      {limits[key] != null && ` / ${limits[key]}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Package Selection */}
          <div className="border p-4 rounded bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Select Package</h3>

            <PackageSelector
              currentPlanId={subscription?.id}
              onSelect={setSelectedPlan}
            />

            {selectedPlan && subscription && (
              <button
                onClick={() => handleChangePlan(selectedPlan.id)}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Change Plan (Prorated)
              </button>
            )}

            {selectedPlan && !subscription && (
              <button
                onClick={() => handleCheckout(selectedPlan.id)}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
              >
                Subscribe
              </button>
            )}
          </div>

          {/* Current Subscription */}
          <div className="border p-4 rounded bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">
              Current Subscription
            </h3>

            {subscription ? (
              <div className="space-y-2">
                <p>Plan: {subscription.name}</p>
                <p>Status: {subscription.active ? "Active" : "Inactive"}</p>
                <p>
                  Period:{" "}
                  {new Date(
                    subscription.start_date
                  ).toLocaleDateString()}{" "}
                  –{" "}
                  {new Date(
                    subscription.end_date
                  ).toLocaleDateString()}
                </p>

                <ToggleAutoRenewButton
                  autoRenew={subscription.auto_renew}
                  onToggle={(val) =>
                    setSubscription({
                      ...subscription,
                      auto_renew: val,
                    })
                  }
                />

                <CancelSubscriptionButton
                  onCancel={loadBillingData}
                />
              </div>
            ) : (
              <p>No active subscription</p>
            )}
          </div>

          {/* Add Card */}
          <div className="border p-4 rounded bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">
              Add Payment Method
            </h3>
            <AddCardForm onCardAdded={loadBillingData} />
          </div>

          {/* Payment Methods */}
          <div className="border p-4 rounded bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">
              Payment Methods
            </h3>
            <PaymentMethodsList
              methods={paymentMethods}
              onUpdated={loadBillingData}
            />
          </div>

          {/* Invoices */}
          <div className="border p-4 rounded bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">
              Invoices
            </h3>
            <InvoicesList invoices={invoices} />
          </div>
        </div>
      </Layout>
    </SubscriptionGate>
  );
}
