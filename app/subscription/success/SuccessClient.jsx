"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session_id = searchParams.get("session_id");
    const tenant_subdomain = window.location.hostname.split(".")[0];

    if (!session_id) {
      setStatus("error");
      setMessage("Missing Stripe session ID.");
      return;
    }

    async function confirmPayment() {
      try {
        const res = await fetch(
          "http://localhost:8000/api/subscription/stripe/confirm/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id, tenant_subdomain }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Stripe confirmation failed.");
        } else {
          setStatus("success");
          setMessage(data.message);
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Unexpected error.");
      }
    }

    confirmPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      {status === "loading" && <p>Processing your payment...</p>}

      {status === "success" && (
        <>
          <h1>Payment Successful!</h1>
          <p>{message}</p>
          <button onClick={() => router.push("/")}>
            Go to Dashboard
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h1>Payment Error</h1>
          <p>{message}</p>
          <button onClick={() => router.push("/subscription/select-plan")}>
            Back to Plans
          </button>
        </>
      )}
    </div>
  );
}
