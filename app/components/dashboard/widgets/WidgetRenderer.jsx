"use client"
import KPICard from "./KPICard";
import GaugeCard from "./GaugeCard";
import AIInsightCard from "./AIInsightCard";

export default function WidgetRenderer({ widget }) {
  switch (widget.type) {
    case "kpi":
      return <KPICard widget={widget} />;

    case "gauge":
      return <GaugeCard widget={widget} />;

    case "insight":
      return <AIInsightCard widget={widget} />;

    default:
      return (
        <div className="rounded-xl border p-4">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}
