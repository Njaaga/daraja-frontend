"use client";

import { PieChart as PieC, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from "recharts";

export default function PieChart({ data }) {
  // Convert ChartRenderer format → { x, y } into Pie-friendly { name, value }
  const processed = data
    .map(row => ({
      name: row.x,               // ← Category label
      value: Number(row.y)       // ← Numeric metric
    }))
    .filter(row => !isNaN(row.value));

  if (!processed.length) return (
    <p className="text-red-500 font-bold">
      ❗ Pie Chart requires numeric Y values.<br/>
      Choose a valid Y field.
    </p>
  );

  return (
    <div className="w-full flex justify-center">
      <ResponsiveContainer width="100%" height={350}>
        <PieC>
          <Pie
            data={processed}
            dataKey="value"
            nameKey="name"
            outerRadius={120}
            label
          >
            {processed.map((_, i) => <Cell key={i} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieC>
      </ResponsiveContainer>
    </div>
  );
}
