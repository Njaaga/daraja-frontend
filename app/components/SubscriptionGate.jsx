"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

const ALLOWED_PATHS = ["/billing", "/login", "/signup", "/verify-email"];

export default function SubscriptionGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSubscription = async () => {
      // Skip gating for public / allowed paths
      if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
        return;
      }

      try {
        const data = await apiClient("/api/subscription/status/");
        const subscription = data?.current_plan;

        const now = new Date();

        if (
          !subscription?.active ||
          (subscription?.end_date &&
            new Date(subscription.end_date) < now)
        ) {
          router.replace("/billing");
        }
      } catch (err) {
        // Not authenticated / session expired
        router.replace("/login");
      }
    };

    checkSubscription();
  }, [pathname, router]);

  // 🚀 Always render children immediately
  return children;
}
