"use client";

import { useState, useEffect } from "react";
import Layout from "@/app/components/Layout";
import PackageSelector from "./components/PackageSelector";
import PaymentMethodsList from "./components/PaymentMethodsList";
import InvoicesList from "./components/InvoicesList";
import CancelSubscriptionButton from "./components/CancelSubscriptionButton";
import ToggleAutoRenewButton from "./components/ToggleAutoRenewButton";
import AddCardForm from "./components/AddCardForm";
import { apiClient, getTenant } from "@/lib/apiClient";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [tenantSubdomain, setTenantSubdomain] = useState(getTenant());
  const [tenantMissing, setTenantMissing] = useState(false);

  // -------------------
  // Load Billing Data
  // -------------------
  const loadBillingData = async () => {
    if (!tenantSubdomain) {
      setTenantMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const subRes = await apiClient("/api/subscription/status/");
      const pmRes = await apiClient("/api/subscription/list-payment-methods/");
      const invRes = await apiClient("/api/subscription/list-invoices/");

      setSubscription(subRes.current_plan || null);
      setPaymentMethods(pmRes.methods || []);
      setInvoices(invRes || []);
      setTenantSubdomain(subRes.tenant_subdomain || tenantSubdomain);
      setTenantMissing(false);
    } catch (err) {
      console.error("Billing load error:", err);
      setTenantMissing(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBillingData();
  }, [tenantSubdomain]);

  // -------------------
  // Change Plan
  // -------------------
  const handleChangePlan = async (planId) => {
    if (!subscription) return;
    try {
      const res = await apiClient("/api/subscription/change-plan/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res.status === "success") {
        alert("Subscription updated with proration!");
        loadBillingData();
      } else {
        alert("Error: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to change plan.");
    }
  };

  // -------------------
  // Subscribe via Checkout
  // -------------------
  const handleCheckout = async (planId) => {
    try {
      const res = await apiClient("/api/subscription/create-checkout-session/", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!res.url) throw new Error("No checkout URL returned");

      window.location.href = res.url;
    } catch (err) {
      console.error("Checkout failed:", err.message);
      alert("Checkout failed. Make sure tenant is correct and webhook is reachable.");
    }
  };

  if (loading) return <p className="p-4">Loading billing info...</p>;

  if (tenantMissing)
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Billing</h1>
          <p className="text-red-600">
            Tenant not detected! Please ensure you are logged in and your tenant is correct.
          </p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Billing</h1>

        {/* Package Selection */}
        <div className="border p-4 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Select Package</h2>
          <PackageSelector onSelect={setSelectedPlan} />
          {selectedPlan && subscription ? (
            <button
              onClick={() => handleChangePlan(selectedPlan.id)}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Change Plan (Prorated)
            </button>
          ) : selectedPlan && !subscription ? (
            <button
              onClick={() => handleCheckout(selectedPlan.id)}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
            >
              Subscribe
            </button>
          ) : null}
        </div>

        {/* Current Subscription */}
        <div className="border p-4 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
          {subscription ? (
            <div className="space-y-1">
              <p>Plan: {subscription.name}</p>
              <p>Status: {subscription.active ? "Active" : "Inactive"}</p>
              <p>
                Period: {new Date(subscription.start_date).toLocaleDateString()} -{" "}
                {new Date(subscription.end_date).toLocaleDateString()}
              </p>
              <ToggleAutoRenewButton
                autoRenew={subscription.auto_renew}
                onToggle={(val) =>
                  setSubscription({ ...subscription, auto_renew: val })
                }
              />
              <CancelSubscriptionButton
                onCancel={() => {
                  setSubscription(null);
                  loadBillingData();
                }}
              />
            </div>
          ) : (
            <p>No active subscription</p>
          )}
        </div>

        {/* Add Card */}
        <div className="border p-4 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Add Payment Method</h2>
          <AddCardForm tenantSubdomain={tenantSubdomain} />
        </div>

        {/* Payment Methods */}
        <div className="border p-4 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Payment Methods</h2>
          <PaymentMethodsList methods={paymentMethods} />
        </div>

        {/* Invoices */}
        <div className="border p-4 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Invoices</h2>
          <InvoicesList invoices={invoices} />
        </div>
      </div>
    </Layout>
  );
}
