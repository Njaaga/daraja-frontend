import {
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";

export default function Trend({
  label,
  currentValue,
  previousValue,
  trendData = []
}) {
  const percent =
    previousValue === 0
      ? 0
      : ((currentValue - previousValue) /
          previousValue) *
        100;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h4>{label}</h4>

      <div className="text-3xl font-bold">
        {currentValue}
      </div>

      <div className="text-green-600">
        {percent.toFixed(1)}%
      </div>

      <div className="h-20 mt-3">
        <ResponsiveContainer>
          <LineChart data={trendData}>
            <Line
              type="monotone"
              dataKey="value"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
