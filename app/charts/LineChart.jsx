"use client";

import "@/lib/chartjs";
import { Line } from "react-chartjs-2";

export default function LineChart({
  data,
  xLabel,
  yLabel,
  onPointClick,
}) {
  if (!data || !data.length) return <p>No data</p>;

  const labels = data.map((d) => d.x);
  const values = data.map((d) => Number(d.y) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        fill: true,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: { mode: "index", intersect: false },
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        title: {
          display: !!xLabel,
          text: xLabel,
        },
      },
      y: {
        beginAtZero: true,
        grid: { drawBorder: false },
        title: {
          display: !!yLabel,
          text: yLabel,
        },
      },
    },
    onClick: (evt, elements) => {
      if (!elements.length || !onPointClick) return;
      const index = elements[0].index;
      onPointClick(data[index]);
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
