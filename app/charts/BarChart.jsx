"use client";

import { BarChart as BC, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BC data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />   {/* 👈 matching ChartRenderer formatted data */}
        <YAxis />
        <Tooltip />
        <Bar dataKey="y" fill="#10b981" />
      </BC>
    </ResponsiveContainer>
  );
}
