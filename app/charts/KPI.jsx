"use client";

import React from "react";

export default function KPI({ value, label = "" }) {
  return (
    <div className="p-4 bg-blue-50 rounded shadow text-center">
      <div className="text-3xl font-bold">{value}</div>
      {label && <div className="text-gray-600 mt-1">{label}</div>}
    </div>
  );
}
