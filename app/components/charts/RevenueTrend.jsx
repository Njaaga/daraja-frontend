"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RevenueTrend({
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
