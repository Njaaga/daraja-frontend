"use client"
export default function AIInsightCard({
  widget,
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="font-semibold">
        AI Insight
      </h3>

      <p className="mt-4 text-sm text-gray-600">
        {widget.text}
      </p>
    </div>
  );
}
