import { apiClient } from "@/lib/apiClient";

export async function getMetricTrend(
  metricId
) {
  return apiClient(
    `/api/metrics/${metricId}/trend/`
  );
}
