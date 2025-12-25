"use client";

import { useState, useEffect } from "react";
import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getTenant, getAccessToken } from "@/lib/apiClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ChoosePlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tenantSubdomain = getTenant();
  const token = getAccessToken();

  useEffect(() => {
    const fetchPlans = async () => {
      if (!tenantSubdomain || !token) {
        setError("Tenant or token not detected.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/subscription/status/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-Tenant-Slug": tenantSubdomain, // ✅ Correct header for middleware
          },
        });

        // If tenant has current plan, redirect to dashboard
        if (res.data.current_plan && res.data.active) {
          router.replace("/dashboards");
          return;
        }

        // Assuming backend also sends available plans
        setPlans(res.data.available_plans || []);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setError("Failed to load plans. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [tenantSubdomain, token, router]);

  const handleSelectPlan = async (planId) => {
    if (!tenantSubdomain || !token) {
      alert("Tenant or token missing.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/subscription/stripe/create-checkout-session/`,
        { plan_id: planId },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-Tenant-Slug": tenantSubdomain, // ✅ Correct header
          },
        }
      );

      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      console.error("Checkout session failed:", err);
      alert(err.response?.data?.error || "Failed to create checkout session.");
    }
  };

  if (loading) return <p>Loading plans...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Choose a Subscription Plan</h1>

        {plans.length === 0 ? (
          <p>No plans available. Please contact support.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border p-4 rounded shadow hover:shadow-md transition cursor-pointer"
                onClick={() => handleSelectPlan(plan.id)}
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 font-bold">${plan.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
