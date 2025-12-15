// components/SubscriptionUsage.jsx
"use client";
import React from "react";

export default function SubscriptionUsage({ label, used, allowed }) {
  const pct = allowed ? Math.round((used / allowed) * 100) : 0;
  const safePct = Math.min(100, Math.max(0, pct));
  return (
    <div className="p-3 border rounded">
      <div className="flex justify-between">
        <div className="font-medium">{label}</div>
        <div className="text-sm">{used} / {allowed ?? "∞"}</div>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded mt-2 overflow-hidden">
        <div style={{ width: `${safePct}%` }} className="h-full rounded bg-gradient-to-r from-blue-400 to-green-400"></div>
      </div>
      <div className="text-xs mt-1">{safePct}%</div>
    </div>
  );
}
