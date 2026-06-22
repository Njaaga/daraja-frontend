export default function Gauge({
  value = 0,
  max = 100,
  label = "Gauge",
}) {
  const percent =
    Math.min((value / max) * 100, 100);

  return (
    <div className="p-4">
      <div className="mb-2">
        {label}
      </div>

      <div className="w-full bg-gray-200 rounded h-6">
        <div
          className="bg-blue-500 h-6 rounded"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="mt-2 text-center">
        {value}
      </div>
    </div>
  );
}
