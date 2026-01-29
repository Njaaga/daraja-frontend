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
import {
  CreditCard,
  Database,
  Users,
  BarChart3,
  UsersRound,
  LifeBuoy,
} from "lucide-react";

export default function BillingPage() {
  const tenant = getTenant();

  const [tenantMissing, setTenantMissing] = useState(!tenant);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------
  // Load billing & usage safely
  // -----------------------------
  const loadBillingData = async () => {
    if (!tenant) return;

    setRefreshing(true);
    try {
      const [subRes, pmRes, invRes, usageRes] = await Promise.all([
        apiClient("/api/subscription/status/"),
        apiClient("/api/subscription/list-payment-methods/"),
        apiClient("/api/subscription/list-invoices/"),
        apiClient("/api/subscription/usage/"),
      ]);

      setSubscription(subRes?.current_plan ?? null);
      setPaymentMethods(Array.isArray(pmRes) ? pmRes : []);
      setInvoices(Array.isArray(invRes) ? invRes : []);

      // 🔒 HARD VALIDATION (this prevents React #418)
      const validUsage =
        usageRes &&
        typeof usageRes === "object" &&
        typeof usageRes.usage === "object" &&
        typeof usageRes.limits === "object";

      setUsage(validUsage ? usageRes : null);
      setTenantMissing(false);
    } catch (err) {
      console.error("Billing load failed:", err);
      setTenantMissing(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenant) loadBillingData();
  }, [tenant]);

  // -----------------------------
  // Actions
  // -----------------------------
  const handleChangePlan = async (planId) => {
    if (!planId) return;
    try {
      const res = await apiClient("/api/subscription/change-plan/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res?.status === "success") loadBillingData();
      else alert(res?.error || "Failed to change plan");
    } catch {
      alert("Failed to change plan");
    }
  };

  const handleCheckout = async (planId) => {
    if (!planId || !tenant) return alert("Tenant missing");
    try {
      const res = await apiClient("/api/subscription/create-checkout-session/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!res?.url) throw new Error();
      window.location.href = res.url;
    } catch {
      alert("Checkout failed");
    }
  };

  // -----------------------------
  // Early exit: tenant missing
  // -----------------------------
  if (tenantMissing) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} /> Billing
          </h2>
          <p className="text-red-600 mt-2">
            Tenant not detected. Please log in again.
          </p>
        </div>
      </Layout>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <SubscriptionGate>
      <Layout>
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} /> Billing
          </h2>

          {refreshing && (
            <p className="text-sm text-gray-500">Refreshing billing data…</p>
          )}

          {/* Package Selection */}
          <div className="border p-4 rounded bg-white">
            <h3 className="font-semibold mb-2">Select Package</h3>
            <PackageSelector
              currentPlanId={subscription?.id}
              onSelect={setSelectedPlan}
            />

            {selectedPlan && subscription && (
              <button
                onClick={() => handleChangePlan(selectedPlan.id)}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Change Plan
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

          {/* Subscription Info */}
          <div className="border p-4 rounded bg-white">
            <h3 className="font-semibold mb-2">Current Subscription</h3>

            {subscription ? (
              <>
                <p>Plan: {subscription.name}</p>
                <p>Status: {subscription.active ? "Active" : "Inactive"}</p>
                <p>
                  Period:{" "}
                  {new Date(subscription.start_date).toLocaleDateString()} –{" "}
                  {new Date(subscription.end_date).toLocaleDateString()}
                </p>

                <div className="mt-3">
                  <ToggleAutoRenewButton
                    autoRenew={subscription.auto_renew}
                    onToggle={(val) =>
                      setSubscription({ ...subscription, auto_renew: val })
                    }
                  />
                </div>

                <div className="mt-2">
                  <CancelSubscriptionButton
                    onCancel={() => {
                      setSubscription(null);
                      loadBillingData();
                    }}
                  />
                </div>
              </>
            ) : (
              <p>No active subscription</p>
            )}
          </div>

          {/* Usage (SAFE) */}
          {usage && (
            <div className="border p-4 rounded bg-white">
              <h3 className="font-semibold mb-2">Usage</h3>
              <ul className="space-y-1 text-sm">
                <li><Database className="inline mr-2" /> Datasets: {usage.usage.datasets ?? 0} / {usage.limits.datasets ?? "∞"}</li>
                <li><UsersRound className="inline mr-2" /> Users: {usage.usage.users ?? 0} / {usage.limits.users ?? "∞"}</li>
                <li><Users className="inline mr-2" /> Groups: {usage.usage.groups ?? 0} / {usage.limits.groups ?? "∞"}</li>
                <li><BarChart3 className="inline mr-2" /> Dashboards: {usage.usage.dashboards ?? 0} / {usage.limits.dashboards ?? "∞"}</li>
                <li><LifeBuoy className="inline mr-2" /> API Rows: {usage.usage.api_rows ?? 0} / {usage.limits.api_rows ?? "∞"}</li>
              </ul>
            </div>
          )}

          <AddCardForm onCardAdded={loadBillingData} />
          <PaymentMethodsList methods={paymentMethods} onUpdated={loadBillingData} />
          <InvoicesList invoices={invoices} />
        </div>
      </Layout>
    </SubscriptionGate>
  );
}
