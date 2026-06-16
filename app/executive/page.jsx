"use client";

import { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";

export default function ExecutivePage() {
  const [kpis, setKpis] = useState([]);

  useEffect(() => {
    fetch("/api/kpis/")
      .then((res) => res.json())
      .then((data) => setKpis(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Executive Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            title={kpi.name}
            value={kpi.current_value}
            target={kpi.target_value}
            unit={kpi.unit}
          />
        ))}
      </div>
    </div>
  );
}
