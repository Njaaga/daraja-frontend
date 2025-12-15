"use client";
import { useState, useEffect } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import axios from "axios";
import SubscriptionUsage from "@/app/components/SubscriptionUsage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ManageSubscriptionPage() {
  const [tenant, setTenant] = useState("");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [counts, setCounts] = useState({ dashboards: 0, users: 0, datasets: 0 });
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const sub = host.split(".")[0];
    setTenant(sub);
  }, []);

  useEffect(() => {
    if (!tenant) return;

    (async () => {
      try {
        const status = await axios.get(`${API_BASE}/api/subscription/status/`, {
          headers: { "X-Tenant-Subdomain": tenant },
        });
        setCurrentPlan(status.data.current_plan);
        setPlans(status.data.available_plans);
      } catch (e) {
        console.error(e);
      }

      try {
        const c = await axios.get(`${API_BASE}/api/subscription/usage/`, {
          headers: { "X-Tenant-Subdomain": tenant },
        });
        setCounts(c.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [tenant]);

  const handleSelectPlan = async (planId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/subscription/stripe/create-checkout/`,
        { plan_id: planId },
        { headers: { "X-Tenant-Subdomain": tenant } }
      );
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      console.error(e);
      alert("Failed to start checkout");
    }
  };

  // ⭐ AUTO-RENEW TOGGLE
  const toggleAutoRenew = async () => {
    if (!currentPlan) return;

    setLoadingToggle(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/subscription/toggle-auto-renew/`,
        {},
        { headers: { "X-Tenant-Subdomain": tenant } }
      );

      setCurrentPlan((prev) => ({
        ...prev,
        auto_renew: res.data.auto_renew,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to toggle auto-renew");
    }
    setLoadingToggle(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Subscription</h1>

      {currentPlan ? (
        <div className="mb-6 p-4 border rounded bg-green-50">
          <h2 className="text-lg font-semibold">{currentPlan.name}</h2>

          {/* ⭐ Auto-Renew Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <label className="font-medium">Auto-Renew</label>

            <button
              onClick={toggleAutoRenew}
              disabled={loadingToggle}
              className={`px-4 py-1 rounded-full text-white ${
                currentPlan.auto_renew ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {loadingToggle
                ? "Saving..."
                : currentPlan.auto_renew
                ? "ON"
                : "OFF"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <SubscriptionUsage
              label="Dashboards"
              used={counts.dashboards}
              allowed={currentPlan.max_dashboards}
            />
            <SubscriptionUsage
              label="Users"
              used={counts.users}
              allowed={currentPlan.max_users}
            />
            <SubscriptionUsage
              label="Datasets"
              used={counts.datasets}
              allowed={currentPlan.max_datasets}
            />
          </div>
        </div>
      ) : (
        <p>No active subscription</p>
      )}

      <h2 className="text-xl mb-3">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-4 border rounded cursor-pointer hover:shadow"
            onClick={() => handleSelectPlan(plan.id)}
          >
            <div className="font-semibold">{plan.name}</div>
            <div className="mt-2 font-bold">${plan.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
