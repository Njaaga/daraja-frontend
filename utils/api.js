"use client";

import axios from "axios";

function getTenantApiBase() {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname; // e.g. client18.localhost
  const tenantHost = host.replace(":3000", "");

  return `http://${tenantHost}:8000`;
}

const api = axios.create({
  baseURL: typeof window !== "undefined" ? getTenantApiBase() : "",
  withCredentials: true,
});

// Automatically attach tenant header
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];
    config.headers["X-Tenant-Subdomain"] = subdomain;

    const token = localStorage.getItem("access_token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default api;
