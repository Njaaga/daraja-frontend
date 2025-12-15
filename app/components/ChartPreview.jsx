import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export default function ChartPreview({ type, data, x, y }) {
  if (!x || (!y && type !== "kpi")) return null;

  if (type === "kpi") {
    return (
      <div className="text-center text-4xl font-bold p-10 bg-gray-100 rounded-xl">
        {data[0]?.[x]}
      </div>
    );
  }

  return (
    <div className="h-80 bg-gray-100 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" && (
          <BarChart data={data}>
            <XAxis dataKey={x} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={y} />
          </BarChart>
        )}

        {type === "line" && (
          <LineChart data={data}>
            <XAxis dataKey={x} />
            <YAxis />
            <Tooltip />
            <Line dataKey={y} />
          </LineChart>
        )}

        {type === "pie" && (
          <PieChart>
            <Tooltip />
            <Pie
              data={data}
              dataKey={y}
              nameKey={x}
              cx="50%"
              cy="50%"
              outerRadius={100}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
