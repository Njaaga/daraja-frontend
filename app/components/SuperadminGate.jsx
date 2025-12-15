"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/apiClient";

export default function SuperadminGate({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.replace("/dashboards"); // redirect normal users
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized) return null; // or loading spinner

  return <>{children}</>;
}
