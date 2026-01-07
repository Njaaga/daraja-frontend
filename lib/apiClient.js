"use client";

const API_BASE = "https://darajatechnologies.ca";

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
  localStorage.setItem("is_superadmin", role === "superadmin" ? "true" : "false");
}

export function isSuperAdmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("is_superadmin") === "true";
}

export function getTenant() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenant_slug");
}

export function saveTenant(tenant) {
  if (typeof window === "undefined") return;
  if (tenant) localStorage.setItem("tenant_slug", tenant);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_slug");
  localStorage.removeItem("is_superadmin");
  window.location.href = "/login";
}

// --------------------
// Refresh Access Token
// --------------------
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.access) {
    saveTokens(data.access, refresh); // ✅ FIXED
    return data.access;
  }

  return null;
}

// --------------------
// API Client (FIXED)
// --------------------
export async function apiClient(url, options = {}, tenantOverride = null) {
  const tenant = tenantOverride || getTenant();
  if (!tenant) throw new Error("Tenant not set");

  let token = getAccessToken();

  const makeHeaders = () => ({
    "Content-Type": "application/json",
    "X-Tenant-Slug": tenant,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  });

  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: makeHeaders(),
  });

  // 🔁 Handle expired token
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      logout();
      throw new Error("SESSION_EXPIRED");
    }

    token = newToken;
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: makeHeaders(),
    });
  }

  // 🚫 Subscription enforcement
  if (response.status === 402) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }

  // ❌ Any other error
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  // ✅ Success
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
