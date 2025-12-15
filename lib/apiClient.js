"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// --------------------
// Token & Tenant Helpers
// --------------------
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function saveTokens(access, refresh) {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function saveUserRole(role) {
  if (typeof window === "undefined") return;
  const isSuper = role === "superadmin";
  localStorage.setItem("is_superadmin", isSuper ? "true" : "false");
}

export function isSuperAdmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("is_superadmin") === "true";
}

export function getTenant() {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("tenant_subdomain");
  if (saved) return saved;
  const host = window.location.hostname;
  const subdomain = host.split(".")[0];
  return subdomain || null;
}

export function saveTenant(tenant) {
  if (typeof window === "undefined") return;
  if (tenant) localStorage.setItem("tenant_subdomain", tenant);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_subdomain");
  localStorage.removeItem("is_superadmin");
  window.location.href = "/login";
}

// --------------------
// Refresh Access Token
// --------------------
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access) saveTokens(data.access);
    return data.access || null;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
}

// --------------------
// API Client
// --------------------
export async function apiClient(url, options = {}) {
  let token = getAccessToken();
  const tenant = getTenant();

  if (!tenant) {
    throw new Error("Tenant not detected");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Tenant-Subdomain": tenant,
    ...(options.headers || {}),
  };

  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      logout();
      throw new Error("Session expired");
    }

    headers.Authorization = `Bearer ${newToken}`;
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
