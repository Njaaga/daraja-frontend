"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { saveTokens, saveTenant, saveUserRole } from "@/lib/apiClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState("");

  // Detect tenant from subdomain
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subdomain = window.location.hostname.split(".")[0];
    setTenant(subdomain);
    saveTenant(subdomain);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!form.email || !form.password) {
    setError("All fields are required");
    return;
  }

  if (!tenant) {
    setError("Tenant not detected. Refresh page.");
    return;
  }

  setLoading(true);

  try {
    const res = await axios.post(
      `${API_BASE}/api/login/`,
      { email: form.email, password: form.password, tenant },
      { headers: { "Content-Type": "application/json", "X-Tenant-Subdomain": tenant } }
    );

    // 🔹 Make the response globally accessible for debugging
    window.lastLoginResponse = res.data;
    console.log("Login response:", res.data);

    if (!res.data.access || !res.data.refresh) {
      setError("Login failed: Tokens missing");
      return;
    }

    // 🔹 Save JWT tokens
    saveTokens(res.data.access, res.data.refresh);

    // 🔹 Determine and save superadmin status
    const isSuper = res.data.is_superadmin ?? (res.data.user?.role === "superadmin");
    localStorage.setItem("is_superadmin", isSuper ? "true" : "false");
    console.log("Saved is_superadmin:", localStorage.getItem("is_superadmin"));

    // 🔹 Save role as well (optional)
    saveUserRole(res.data.user?.role || "user");

    // Redirect based on subscription
    const subscription = res.data.subscription;
    if (!subscription?.is_active) router.push("/choose-plan");
    else router.push("/dashboards");

  } catch (err) {
    setError(err.response?.data?.error || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <button type="submit" disabled={loading || !tenant} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
