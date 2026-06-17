"use client"
export default function KPICard({ widget }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="text-sm text-gray-500">
        {widget.title}
      </div>

      <div className="mt-3 text-4xl font-bold">
        {widget.value}
      </div>

      <div className="mt-2 text-sm text-gray-500">
        Target: {widget.target}
      </div>

      <div className="mt-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            widget.status === "healthy"
              ? "bg-green-100 text-green-700"
              : widget.status === "warning"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {widget.status}
        </span>
      </div>
    </div>
  );
}
