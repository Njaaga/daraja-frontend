"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/forgot-password/`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessage(
        "If the email exists, a password reset link has been sent to your inbox."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Forgot Password
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
