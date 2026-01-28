"use client";

import React, { useEffect, useRef, useState } from "react";
import Layout from "@/app/components/Layout";
import AuthGuard from "@/app/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";
import ChartRenderer from "@/app/components/ChartRenderer";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";

export default function DashboardView({ params }) {
  const { id } = params;

  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store base64 images of charts
  const chartImagesRef = useRef({});

  /* ============================
     FETCH DASHBOARD
  ============================ */
  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/dashboards/${id}/`);
        setDashboard(res.data);
        setCharts(res.data.charts || []);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  /* ============================
     PDF EXPORT (SAFE VERSION)
  ============================ */
  const handleExportPDF = () => {
    if (!charts.length) {
      alert("No charts to export.");
      return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 15;

    // Dashboard title
    pdf.setFontSize(18);
    pdf.text(dashboard?.name || "Dashboard", 10, y);
    y += 10;

    charts.forEach((chart, index) => {
      const img = chartImagesRef.current[chart.i];
      if (!img) return;

      const imgProps = pdf.getImageProperties(img);
      const imgWidth = pageWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      if (y + imgHeight > pageHeight - 10) {
        pdf.addPage();
        y = 15;
      }

      // Chart title
      pdf.setFontSize(12);
      pdf.text(chart.title || `Chart ${index + 1}`, 10, y);
      y += 5;

      pdf.addImage(img, "PNG", 10, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    });

    pdf.save(`${dashboard?.name || "dashboard"}.pdf`);
  };

  /* ============================
     RENDER
  ============================ */
  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading dashboard…</div>
      </Layout>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {dashboard?.name}
            </h1>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download size={18} />
              Export PDF
            </button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart) => (
              <div
                key={chart.i}
                className="bg-white rounded-xl shadow p-4"
              >
                <h3 className="font-medium mb-3">
                  {chart.title}
                </h3>

                <ChartRenderer
                  chart={chart}
                  onReady={(chartInstance) => {
                    if (chartInstance?.toBase64Image) {
                      chartImagesRef.current[chart.i] =
                        chartInstance.toBase64Image();
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
