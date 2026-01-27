"use client";

import SubscriptionGate from "@/app/components/SubscriptionGate"
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
} from "lucide-react";



export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [superAdmin, setSuperAdmin] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef();

  // Open Settings if current pathname is under it
  const isSettingsRoute = pathname.startsWith("/billing") || pathname.startsWith("/support");;
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSuperAdmin(isSuperAdmin());
    }
  }, []);

  // Update settingsOpen dynamically if route changes
  useEffect(() => {
    setSettingsOpen(isSettingsRoute);
  }, [pathname]);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const [user, setUser] = useState(null);
  useEffect(() => {
  const loadUser = async () => {
    try {
      const me = await apiClient("/api/users/me/");
      setUser(me);
    } catch (err) {
      console.error("Failed to load user");
    }
  };

  loadUser();
}, []);
  
  const isActive = (path) => pathname === path || pathname.startsWith(path);

  const handleLogout = () => {
    apiLogout();
    router.push("/login");
  };

  return (
    <SubscriptionGate>
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">Daraja App</h1>
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
          >
            <span>{user?.email || "Account"}</span>
          </button>
          {avatarMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow-lg border border-gray-200 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-gray-800 text-white w-64">
          <div className="p-4 font-bold border-b border-gray-700">Admin Panel</div>
          <nav className="p-4 flex flex-col gap-2 text-sm">
            {superAdmin && (
              <>
              <Link
                href="/charts"
                className={`p-2 rounded flex items-center gap-2 ${
                  isActive("/charts")
                    ? "bg-blue-600 font-semibold"
                    : "hover:bg-gray-700"
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard Builder
              </Link>

            
                <Link
                  href="/api-sources"
                  className={`p-2 rounded ${isActive("/api-sources") ? "bg-blue-500 font-semibold" : "hover:bg-gray-700"}`}
                >
                  API Sources
                </Link>
            
                <Link
                  href="/datasets"
                  className={`p-2 rounded ${isActive("/datasets") ? "bg-blue-500 font-semibold" : "hover:bg-gray-700"}`}
                >
                  Datasets
                </Link>
              </>
            )}

            <Link
              href="/dashboards"
              className={`p-2 rounded ${isActive("/dashboards") ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"}`}
            >
              Dashboards
            </Link>
              {superAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className={`p-2 rounded ${isActive("/admin/users") ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"}`}
                  >
                    Users
                  </Link>
                  </>
              )}
                  <Link
                    href="/admin/groups"
                    className={`p-2 rounded ${isActive("/admin/groups") ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"}`}
                  >
                    Groups
                  </Link>
                
              

              
          
            {/* Settings Menu */}
            {superAdmin && (
            <>
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`w-full text-left p-2 rounded flex justify-between items-center
                  ${isSettingsRoute ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"}`}
              >
                <span>Settings</span>
                <span>{settingsOpen ? "▲" : "▼"}</span>
              </button>
                  
              {settingsOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-1 text-xs">
                  <Link
                    href="/billing"
                    className={`p-2 rounded ${isActive("/billing") ? "bg-blue-500 font-semibold" : "hover:bg-gray-700"}`}
                  >
                    Billing
                  </Link>
                  
                  <Link
                    href="/support"
                    className={`p-2 rounded ${isActive("/support") ? "bg-blue-500 font-semibold" : "hover:bg-gray-700"}`}
                  >
                    Support
                  </Link>
                  
                </div>
              )}
              
            </div>
            </>
          )}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-100">{children}</main>
      </div>
    </div>
    </SubscriptionGate>
  );
}
