import { apiClient } from "@/lib/apiClient";

export async function getExecutiveDashboard() {
  return apiClient("/api/kpis/executive/");
}
