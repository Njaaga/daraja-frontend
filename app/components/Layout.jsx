"use client";

import SubscriptionGate from "@/app/components/SubscriptionGate";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiClient, logout as apiLogout, isSuperAdmin } from "@/lib/apiClient";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Users,
  UsersRound,
  Settings,
  CreditCard,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [superAdmin, setSuperAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef(null);

  const isSettingsRoute =
    pathname.startsWith("/billing") || pathname.startsWith("/support");

  useEffect(() => {
    setSuperAdmin(isSuperAdmin());
    setSettingsOpen(isSettingsRoute);
  }, [pathname]);

  useEffect(() => {
    const close = (e) =>
      avatarRef.current &&
      !avatarRef.current.contains(e.target) &&
      setAvatarMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const [user, setUser] = useState(null);
  useEffect(() => {
    apiClient("/api/users/me/")
      .then(setUser)
      .catch(() => {});
  }, []);

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path);

  const navItem = (href, label, Icon) => (
    <Link
      href={href}
      className={`flex items-center gap-3 p-2 rounded transition ${
        isActive(href)
          ? "bg-blue-600 font-semibold"
          : "hover:bg-gray-700"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <SubscriptionGate>
      <div className="h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-6">
          <h1 className="text-lg font-bold">Daraja App</h1>

          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              {user?.email || "Account"}
            </button>

            {avatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow border z-50">
                <button
                  onClick={() => {
                    apiLogout();
                    router.push("/login");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`bg-gray-800 text-white transition-all duration-300 ${
              collapsed ? "w-20" : "w-64"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              {!collapsed && <span className="font-bold">Admin Panel</span>}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {collapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            </div>

            {/* Nav */}
            <nav className="p-3 flex flex-col gap-1 text-sm">
              {superAdmin && (
                <>
                  {navItem("/charts", "Dashboard Builder", LayoutDashboard)}
                  {navItem("/api-sources", "API Sources", Database)}
                  {navItem("/datasets", "Datasets", BarChart3)}
                </>
              )}

              {navItem("/dashboards", "Dashboards", LayoutDashboard)}

              {superAdmin && navItem("/admin/users", "Users", Users)}
              {navItem("/admin/groups", "Groups", UsersRound)}

              {/* Settings */}
              {superAdmin && (
                <>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`flex items-center justify-between p-2 rounded ${
                      isSettingsRoute
                        ? "bg-blue-600 font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings size={18} />
                      {!collapsed && <span>Settings</span>}
                    </span>
                    {!collapsed && (settingsOpen ? "▲" : "▼")}
                  </button>

                  {settingsOpen && !collapsed && (
                    <div className="ml-6 mt-1 flex flex-col gap-1 text-xs">
                      {navItem("/billing", "Billing", CreditCard)}
                      {navItem("/support", "Support", LifeBuoy)}
                    </div>
                  )}
                </>
              )}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-auto bg-gray-100 p-6">
            {children}
          </main>
        </div>
      </div>
    </SubscriptionGate>
  );
}
