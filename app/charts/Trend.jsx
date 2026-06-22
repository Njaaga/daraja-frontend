// app/charts/Trend.jsx

export default function Trend({
  currentValue,
  previousValue,
  label,
}) {
  const pct =
    previousValue > 0
      ? ((currentValue - previousValue) /
          previousValue) *
        100
      : 0;

  return (
    <div className="p-4">
      <div className="text-sm text-gray-500">
        {label}
      </div>

      <div className="text-3xl font-bold">
        {currentValue}
      </div>

      <div
        className={
          pct >= 0
            ? "text-green-600"
            : "text-red-600"
        }
      >
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}
