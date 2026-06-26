import { useState } from "react";

export default function useDashboardBuilder() {
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardId, setDashboardId] = useState(null);

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // dataset objects

  return {
    dashboardName,
    setDashboardName,

    dashboardId,
    setDashboardId,

    datasets,
    setDatasets,

    selectedDatasets,
    setSelectedDatasets,
  };
}
