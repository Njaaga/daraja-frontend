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

  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const avatarRef = useRef(null);
  const settingsRef = useRef(null);

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path);

  const isSettingsRoute =
    pathname.startsWith("/billing") || pathname.startsWith("/support");

  /* ---------- Bootstrap ---------- */
  useEffect(() => {
    setSuperAdmin(isSuperAdmin());
  }, []);

  useEffect(() => {
    setSettingsOpen(isSettingsRoute);
  }, [pathname]);

  useEffect(() => {
    apiClient("/api/users/me/")
      .then(setUser)
      .catch(() => {});
  }, []);

  /* ---------- Outside click ---------- */
  useEffect(() => {
    const close = (e) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(e.target)
      ) {
        setAvatarOpen(false);
      }
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    apiLogout();
    router.push("/login");
  };

  const NavItem = ({ href, icon: Icon, label }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 p-2 rounded ${
        isActive(href)
          ? "bg-blue-600 font-semibold"
          : "hover:bg-gray-700"
      }`}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <SubscriptionGate>
      <div className="h-screen flex flex-col">
        {/* ───────── Top Bar ───────── */}
        <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-6">
          <h1 className="font-bold">Daraja App</h1>

          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              {user?.email || "Account"}
            </button>

            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ───────── Main ───────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ───────── Sidebar ───────── */}
          <aside
            className={`bg-gray-800 text-white transition-all duration-200 ${
              collapsed ? "w-16" : "w-64"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              {!collapsed && <span className="font-bold">Reporting</span>}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hover:bg-gray-700 p-1 rounded"
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </button>
            </div>

            <nav className="p-2 flex flex-col gap-1 text-sm">
              {superAdmin && (
                <>
                  <NavItem
                    href="/charts"
                    icon={LayoutDashboard}
                    label="Dashboard Builder"
                  />
                  <NavItem
                    href="/api-sources"
                    icon={Database}
                    label="API Sources"
                  />
                  <NavItem
                    href="/datasets"
                    icon={BarChart3}
                    label="Datasets"
                  />
                </>
              )}

              <NavItem
                href="/dashboards"
                icon={LayoutDashboard}
                label="Dashboards"
              />

              {superAdmin && (
                <NavItem
                  href="/admin/users"
                  icon={Users}
                  label="Users"
                />
              )}

              <NavItem
                href="/admin/groups"
                icon={UsersRound}
                label="Groups"
              />

              {/* ───────── Settings ───────── */}
              {superAdmin && (
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center justify-between p-2 rounded ${
                      isSettingsRoute
                        ? "bg-blue-600 font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings size={18} />
                      {!collapsed && "Settings"}
                    </span>
                    {!collapsed && (settingsOpen ? "▲" : "▼")}
                  </button>

                  {/* Expanded */}
                  {settingsOpen && !collapsed && (
                    <div className="ml-6 mt-1 flex flex-col gap-1 text-xs">
                      <NavItem
                        href="/billing"
                        icon={CreditCard}
                        label="Billing"
                      />
                      <NavItem
                        href="/support"
                        icon={LifeBuoy}
                        label="Support"
                      />
                    </div>
                  )}

                  {/* Collapsed Popover */}
                  {settingsOpen && collapsed && (
                    <div className="absolute left-full top-0 ml-2 w-40 bg-gray-800 border border-gray-700 rounded shadow z-50">
                      <NavItem
                        href="/billing"
                        icon={CreditCard}
                        label="Billing"
                      />
                      <NavItem
                        href="/support"
                        icon={LifeBuoy}
                        label="Support"
                      />
                    </div>
                  )}
                </div>
              )}
            </nav>
          </aside>

          {/* ───────── Content ───────── */}
          <main className="flex-1 overflow-auto p-6 bg-gray-100">
            {children}
          </main>
        </div>
      </div>
    </SubscriptionGate>
  );
}
