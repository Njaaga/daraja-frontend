"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = "http://18.220.106.255/";

export default function ClientSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    subdomain: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.companyName || !form.subdomain || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/tenants/signup/`, {
        name: form.companyName,
        subdomain: form.subdomain,
        email: form.email,
        password: form.password,
      });

      if (res.status === 201) {
        const protocol = window.location.protocol; // http: or https:
        const port = window.location.port ? `:${window.location.port}` : "";
        const baseHost = window.location.hostname;

        // Handle localhost specially
        const domain =
          baseHost === "localhost"
            ? `${form.subdomain}.localhost`
            : `${form.subdomain}.${baseHost.split('.').slice(1).join('.')}`;

        const subdomainUrl = `${protocol}//${domain}${port}/login`;
        window.location.href = subdomainUrl;
      }

    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data?.error || "Signup failed. Check your input.");
      } else {
        setError("Network error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Client Signup</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="block mb-1 font-medium">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block mb-1 font-medium">Subdomain</label>
            <input
              type="text"
              name="subdomain"
              value={form.subdomain}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="example: clienta"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
