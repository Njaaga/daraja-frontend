"use client"
export default function GaugeCard({ widget }) {
  const pct = Math.min(
    Math.round(widget.percent || 0),
    100
  );

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="font-semibold">
        {widget.title}
      </h3>

      <div className="mt-6 text-center">
        <div className="text-5xl font-bold">
          {pct}%
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600"
          style={{
            width: `${pct}%`,
          }}
        />
      </div>
    </div>
  );
}
