"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const STATUS = {
  SUCCESS: "success",
  ERROR: "error",
};

export default function SetPasswordClient() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!password || !confirmPassword) {
      setStatus({
        message: "Please fill both fields",
        type: STATUS.ERROR,
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        message: "Passwords do not match",
        type: STATUS.ERROR,
      });
      return;
    }

    if (!uid || !token) {
      setStatus({
        message: "Invalid or expired password reset link",
        type: STATUS.ERROR,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/set-password/`, {
        uid,
        token,
        password,
      });

      setStatus({
        message: res?.data?.message || "Password set successfully",
        type: STATUS.SUCCESS,
      });

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error(err.response?.data || err);
      setStatus({
        message:
          err.response?.data?.error || "Failed to set password",
        type: STATUS.ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Set Your Password</h2>

        {/* Status message */}
        {status?.message && (
          <div
            className={`mb-4 p-3 rounded border ${
              status.type === STATUS.ERROR
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-2 border rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Setting..." : "Set Password"}
          </button>
        </form>

        <p className="mt-3 text-sm text-gray-500">
          You will be redirected to login after a successful password reset.
        </p>
      </div>
    </div>
  );
}
