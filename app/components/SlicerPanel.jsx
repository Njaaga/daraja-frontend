// /app/components/SlicerPanel.jsx
"use client";

export default function SlicerPanel({ fields, filters, onChange }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="font-semibold mb-3">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-sm text-gray-600">{field}</label>
            <input
              type="text"
              value={filters[field]?.value || ""}
              onChange={(e) =>
                onChange(field, {
                  type: "text",
                  value: e.target.value,
                })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder={`Filter ${field}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
