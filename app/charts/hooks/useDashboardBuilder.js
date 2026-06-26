import { useState } from "react";

export default function useDashboardBuilder() {
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardId, setDashboardId] = useState(null);

  return {
    dashboardName,
    setDashboardName,

    dashboardId,
    setDashboardId,
  };
}
