"use client";

import RevenueTrend from "@/app/components/charts/RevenueTrend";

export default function WidgetRenderer({ widget }) {
  switch (widget.type) {

    case "kpi":
      return (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-semibold">
            {widget.title}
          </h3>

          <div className="text-4xl font-bold mt-4">
            {widget.value}
          </div>

          <div className="text-gray-500 mt-2">
            Target: {widget.target}
          </div>
        </div>
      );

    case "gauge":
      return (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-4">
            {widget.title}
          </h3>

          <div className="text-5xl font-bold">
            {widget.percent}%
          </div>
        </div>
      );

    case "insight":
      return (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-4">
            AI Insight
          </h3>

          <p>{widget.text}</p>
        </div>
      );

    case "trend":
      return (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-4">
            {widget.title}
          </h3>

          <RevenueTrend
            data={widget.data || []}
          />
        </div>
      );

    default:
      return (
        <div className="bg-red-100 p-4 rounded">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}
