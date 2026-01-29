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
import { CreditCard, BarChart3 } from "lucide-react";

export default function BillingPage() {
  const tenant = getTenant();

  const [tenantMissing, setTenantMissing] = useState(!tenant);
  const [refreshing, setRefreshing] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [usage, setUsage] = useState(null);
  const [limits, setLimits] = useState(null);

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
        apiClient("/api/subscription/usage/"),
      ]);

      setSubscription(subRes?.current_plan || null);
      setPaymentMethods(pmRes || []);
      setInvoices(invRes || []);
      setUsage(usageRes?.usage || null);
      setLimits(usageRes?.limits || null);

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
  // Render helpers
  // -----------------------------
  const renderUsageRow = (label, used, limit) => (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">
        {used} / {limit ?? "∞"}
      </span>
    </div>
  );

  // -----------------------------
  // Missing tenant
  // -----------------------------
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

  // -----------------------------
  // Main render
  // -----------------------------
  return (
    <SubscriptionGate>
      <Layout>
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} />
            Billing
          </h2>

          {refreshing && (
            <p className="text-sm text-gray-500">Refreshing billing data…</p>
          )}

          {/* Usage */}
          {usage && limits && (
            <div className="border p-4 rounded-lg bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <BarChart3 size={18} />
                Usage
              </h2>

              <div className="space-y-2">
                {renderUsageRow("Datasets", usage.datasets, limits.datasets)}
                {renderUsageRow("API Rows", usage.api_rows, limits.api_rows)}
                {renderUsageRow("Users", usage.users, limits.users)}
                {renderUsageRow("Groups", usage.groups, limits.groups)}
                {renderUsageRow(
                  "Dashboards",
                  usage.dashboards,
                  limits.dashboards
                )}
              </div>
            </div>
          )}

          {/* Package Selection */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Select Package</h2>

            <PackageSelector
              currentPlanId={subscription?.id}
              onSelect={setSelectedPlan}
            />

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

          {/* Current Subscription */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              Current Subscription
            </h2>

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
              </div>
            ) : (
              <p>No active subscription</p>
            )}
          </div>

          {/* Add Card */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              Add Payment Method
            </h2>
            <AddCardForm onCardAdded={loadBillingData} />
          </div>

          {/* Payment Methods */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              Payment Methods
            </h2>
            <PaymentMethodsList
              methods={paymentMethods}
              onUpdated={loadBillingData}
            />
          </div>

          {/* Invoices */}
          <div className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Invoices</h2>
            <InvoicesList invoices={invoices} />
          </div>
        </div>
      </Layout>
    </SubscriptionGate>
  );
}
