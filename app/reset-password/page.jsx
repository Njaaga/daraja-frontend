"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/reset-password/`,
        {
          token,
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessage("Your password has been reset successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Reset Password
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
            {message}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full border p-2 rounded"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-blue-600 hover:underline text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
