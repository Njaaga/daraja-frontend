"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import { loadStripe } from "@stripe/stripe-js";
import { apiClient } from "@/lib/apiClient";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BillingPage() {
  const [tenant, setTenant] = useState("");
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const sub = window.location.hostname.split(".")[0];
    setTenant(sub);
  }, []);

  const loadStatus = async () => {
    const res = await apiClient("/api/subscription/status/");
    setStatus(res.current_plan);
    setPlans(res.available_plans);
  };

  useEffect(() => {
    if (!tenant) return;

    loadStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1" && params.get("session_id")) {
      apiClient("/api/subscription/stripe/confirm/", {
        method: "POST",
        body: JSON.stringify({
          session_id: params.get("session_id"),
          tenant_subdomain: tenant,
        }),
      }).then(loadStatus);
    }
  }, [tenant]);

  const startCheckout = async (planId) => {
    const res = await apiClient("/api/subscription/stripe/create-checkout/", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    });
    if (res.url) window.location.href = res.url;
  };

  return (
    <Layout>
      <h1>Billing</h1>

      {status ? (
        <div>
          <h2>Current Plan</h2>
          <p>{status.name}</p>
          <p>Valid until: {status.end_date}</p>
        </div>
      ) : (
        <p>No active subscription</p>
      )}

      <h2>Available Plans</h2>
      {plans.map((p) => (
        <button key={p.id} onClick={() => startCheckout(p.id)}>
          Subscribe to {p.name} – ${p.price}
        </button>
      ))}
    </Layout>
  );
}
