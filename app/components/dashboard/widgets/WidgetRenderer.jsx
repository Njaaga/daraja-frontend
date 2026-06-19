"use client"
import RevenueTrend from "@/app/components/charts/RevenueTrend";
import KPICard from "./KPICard";
import GaugeCard from "./GaugeCard";
import AIInsightCard from "./AIInsightCard";

export default function WidgetRenderer({ widget }) {
  switch (widget.type) {
  
    case "kpi":
      return <KPIWidget widget={widget} />;
  
    case "gauge":
      return <GaugeWidget widget={widget} />;
  
    case "insight":
      return <InsightWidget widget={widget} />;
  
    case "trend":
      return (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-bold text-lg mb-4">
            {widget.title}
          </h3>
  
          <RevenueTrend
            data={widget.data || []}
          />
        </div>
      );
  
    default:
      return (
        <div>
          Unknown widget type: {widget.type}
        </div>
      );
  }
}
