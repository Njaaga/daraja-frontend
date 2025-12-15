"use client";

import { LineChart as LC, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function LineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LC data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />        {/* ← matches ChartRenderer formatting */}
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} />
      </LC>
    </ResponsiveContainer>
  );
}
