export default function ExecutiveDashboard() {
  return (
    <div className="space-y-6">
      <h1>Executive Dashboard</h1>

      <KpiGrid />

      <RevenueTrend />

      <InsightsPanel />

      <AlertsPanel />
    </div>
  );
}
