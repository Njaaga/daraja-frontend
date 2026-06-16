"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function RevenueTrend() {

  const data = [
    { month: "Jan", revenue: 100000 },
    { month: "Feb", revenue: 115000 },
    { month: "Mar", revenue: 128000 },
    { month: "Apr", revenue: 142000 },
    { month: "May", revenue: 151000 },
  ];

  return (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
