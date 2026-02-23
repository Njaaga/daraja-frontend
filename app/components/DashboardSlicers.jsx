"use client";

export default function DashboardSlicers({ slicers, onChange, onClear }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Date field */}
      <div>
        <label className="text-xs text-gray-600">Date Field</label>
        <select
          value={slicers.date_field || ""}
          onChange={e => onChange("date_field", e.target.value)}
          className="w-full border px-2 py-1 text-sm rounded"
        >
          <option value="">Select date field</option>
          <option value="TxnDate">TxnDate</option>
          <option value="DueDate">DueDate</option>
          <option value="MetaData.CreateTime">Create Time</option>
        </select>
      </div>

      {/* From */}
      <div>
        <label className="text-xs text-gray-600">From</label>
        <input
          type="date"
          value={slicers.from || ""}
          onChange={e => onChange("from", e.target.value)}
          className="w-full border px-2 py-1 text-sm rounded"
        />
      </div>

      {/* To */}
      <div>
        <label className="text-xs text-gray-600">To</label>
        <input
          type="date"
          value={slicers.to || ""}
          onChange={e => onChange("to", e.target.value)}
          className="w-full border px-2 py-1 text-sm rounded"
        />
      </div>

      {/* Clear */}
      <div className="flex items-end">
        <button
          onClick={onClear}
          className="w-full bg-gray-200 py-1 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
