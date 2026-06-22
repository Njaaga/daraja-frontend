"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function TrendChart({
  data,
  xKey = "date",
  yKey = "value",
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke="#2563eb"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
