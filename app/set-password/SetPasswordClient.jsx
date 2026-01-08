"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const API_URL = "https://darajatechnologies.ca";

export default function SetPasswordClient() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!password || !confirmPassword) {
      setStatus("Please fill both fields");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }

    if (!uid || !token) {
      setStatus("Missing UID or token in the link");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/set-password/`, {
        uid,
        token,
        password,
      });

      setStatus(res.data.message || "Password set successfully");

      setTimeout(() => router.push("/login"), 2000);

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err.response?.data || err);
      setStatus(
        err.response?.data?.error || "Failed to set password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Set Your Password</h2>

        {status && <p className="mb-4 text-red-600">{status}</p>}

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
            className="bg-blue-600 text-white p-2 rounded mt-2"
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
