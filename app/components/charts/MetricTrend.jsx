"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function MetricTrend({
  data,
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="value"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
