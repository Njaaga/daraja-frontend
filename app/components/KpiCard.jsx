export default function KpiCard({
  title,
  value,
  target,
  unit,
}) {
  const percent =
    target > 0
      ? Math.round((value / target) * 100)
      : 0;

  return (
    <div className="rounded-xl border p-6">
      <h3 className="text-sm font-medium">
        {title}
      </h3>

      <div className="mt-2 text-3xl font-bold">
        {unit}{value}
      </div>

      <div className="mt-2 text-sm">
        Target: {unit}{target}
      </div>

      <div className="mt-1 text-sm">
        {percent}% achieved
      </div>
    </div>
  );
}
