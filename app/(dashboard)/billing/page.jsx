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
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------
  // Load billing + usage
  // -----------------------------
  const loadBillingData = async () => {
    if (!tenant) return;
    setRefreshing(true);
    try {
      const [subRes, pmRes, invRes, usageRes] = await Promise.all([
        apiClient("/api/subscription/status/"),
        apiClient("/api/subscription/list-payment-methods/"),
        apiClient("/api/subscription/list-invoices/"),
        apiClient("/api/subscription/usage/"), // Usage endpoint
      ]);

      setSubscription(subRes?.current_plan || null);
      setPaymentMethods(pmRes || []);
      setInvoices(invRes || []);
      setUsage(usageRes || null);
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
    try {
      const res = await apiClient("/api/subscription/change-plan/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res.status === "success") loadBillingData();
      else alert(res.error || "Failed to change plan");
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
      if (!res.url) throw new Error();
      window.location.href = res.url;
    } catch {
      alert("Checkout failed");
    }
  };

  // -----------------------------
  // Usage helper
  // -----------------------------
  const percentUsed = (used, limit) => (limit ? Math.min(Math.round((used / limit) * 100), 100) : 0);

  if (tenantMissing) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CreditCard size={24} /> Billing
          </h2>
          <p className="text-red-600">Tenant not detected. Please log in again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <SubscriptionGate>
      <Layout>
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CreditCard size={24} /> Billing & Usage
          </h2>

          {refreshing && <p className="text-sm text-gray-500">Refreshing billing data…</p>}

          {/* ---------------- Usage Overview ---------------- */}
          {usage && subscription && (
            <div className="border p-4 rounded-lg bg-white shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Plan Usage</h3>

              {[
                { name: "Datasets", key: "datasets" },
                { name: "API Rows", key: "api_rows" },
                { name: "Users", key: "users" },
                { name: "Groups", key: "groups" },
                { name: "Dashboards", key: "dashboards" },
              ].map((item) => {
                const used = usage.usage[item.key] || 0;
                const limit = usage.limits[item.key] || 0;
                const pct = percentUsed(used, limit);

                return (
                  <div key={item.key}>
                    <div className="flex justify-between mb-1">
                      <span>{item.name}</span>
                      <span>{used} / {limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-3">
                      <div
                        className={`h-3 rounded ${
                          pct >= 90
                            ? "bg-red-500"
                            : pct >= 70
                            ? "bg-yellow-400"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------- Package Selection ---------------- */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Select Package</h3>
            <PackageSelector currentPlanId={subscription?.id} onSelect={setSelectedPlan} />
            {selectedPlan && subscription && (
              <button
                onClick={() => handleChangePlan(selectedPlan.id)}
                className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Change Plan (Prorated)
              </button>
            )}
            {selectedPlan && !subscription && (
              <button
                onClick={() => handleCheckout(selectedPlan.id)}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
              >
                Subscribe
              </button>
            )}
          </div>

          {/* ---------------- Current Subscription ---------------- */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Current Subscription</h3>
            {subscription ? (
              <div className="space-y-1">
                <p>Plan: {subscription.name}</p>
                <p>Status: {subscription.active ? "Active" : "Inactive"}</p>
                <p>
                  Period:{" "}
                  {new Date(subscription.start_date).toLocaleDateString()} –{" "}
                  {new Date(subscription.end_date).toLocaleDateString()}
                </p>
                <div className="mt-4">
                  <ToggleAutoRenewButton
                    autoRenew={subscription.auto_renew}
                    onToggle={(val) => setSubscription({ ...subscription, auto_renew: val })}
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
              </div>
            ) : (
              <p>No active subscription</p>
            )}
          </div>

          {/* ---------------- Add Card ---------------- */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Add Payment Method</h3>
            <AddCardForm onCardAdded={loadBillingData} />
          </div>

          {/* ---------------- Payment Methods ---------------- */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Payment Methods</h3>
            <PaymentMethodsList methods={paymentMethods} onUpdated={loadBillingData} />
          </div>

          {/* ---------------- Invoices ---------------- */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Invoices</h3>
            <InvoicesList invoices={invoices} />
          </div>
        </div>
      </Layout>
    </SubscriptionGate>
  );
}
