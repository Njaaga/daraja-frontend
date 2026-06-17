"use client";

import { useEffect, useState } from "react";
import WidgetRenderer from "@/app/components/dashboard/widgets/WidgetRenderer";

export default function ExecutivePage() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // Temporary test data

      const dashboardWidgets = [
        {
          id: 1,
          type: "kpi",
          title: "Revenue",
          value: "$142,500",
          target: "$150,000",
          status: "healthy",
        },
        {
          id: 2,
          type: "kpi",
          title: "Profit",
          value: "$52,000",
          target: "$60,000",
          status: "warning",
        },
        {
          id: 3,
          type: "gauge",
          title: "Revenue Goal",
          percent: 78,
        },
        {
          id: 4,
          type: "insight",
          text: "Revenue increased 12% compared to last month.",
        },
        {
          id: 5,
          type: "insight",
          text: "Customer acquisition accelerated by 8%.",
        },
      ];

      setWidgets(dashboardWidgets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading Executive Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Executive Command Center
        </h1>

        <p className="mt-2 text-gray-500">
          Executive business intelligence dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {widgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
          />
        ))}

      </div>

    </div>
  );
}
