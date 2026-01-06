"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { saveTokens, saveTenant, saveUserRole } from "@/lib/apiClient";
import Link from "next/link";

const API_BASE = "https://darajatechnologies.ca";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/tenants/login/`,
        { email: form.email, password: form.password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;

      if (!data?.access || !data?.refresh) {
        throw new Error("Invalid login response (missing tokens)");
      }

      saveTokens(data.access, data.refresh);

      let tenantSlug = typeof data.tenant === "string" ? data.tenant : data.tenant?.slug;
      if (!tenantSlug) throw new Error("Tenant not found. Contact support.");

      saveTenant(tenantSlug);
      saveUserRole(data.user?.role || "user");

      if (data.subscription && !data.subscription.is_active) {
        router.push("/choose-plan");
      } else {
        router.push("/dashboards");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Industry-standard Forgot Password link */}
        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:underline text-sm"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
