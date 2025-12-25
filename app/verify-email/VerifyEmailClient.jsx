"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function VerifyEmail() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("Invalid verification link.");
      return;
    }

    axios.post(`${API_URL}/api/tenants/verify-email/`, { uid, token })
      .then(() => {
        setStatus("Email verified! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      })
      .catch(() => {
        setStatus("Verification failed. Link expired or invalid.");
      });
  }, [uid, token]);

  return (
    <div className="flex justify-center items-center h-screen text-lg">
      {status}
    </div>
  );
}
