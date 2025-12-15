"use client";
import { useState } from "react";

export default function SetPasswordForm({ uid, token }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/set-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token, password }),
        }
      );

      const data = await res.json();
      if (res.ok) setStatus("Password set successfully. You can now log in.");
      else setStatus(data.error || "Failed to set password");
    } catch (err) {
      setStatus("Network error. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center p-10">
      <h1 className="text-xl font-bold mb-4">Set Password</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 w-80">
        <input
          type="password"
          placeholder="New Password"
          className="p-2 border rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="p-2 border rounded"
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded"
        >
          Set Password
        </button>
      </form>

      {status && <p className="mt-3 text-red-600">{status}</p>}
    </div>
  );
}
