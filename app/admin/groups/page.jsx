"use client";

import Layout from "@/app/components/Layout";
import { useEffect, useState } from "react";
import { apiClient, isSuperAdmin } from "@/lib/apiClient";
import Select from "react-select";
import Link from "next/link";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Users,
  UsersRound,
  Settings,
  CreditCard,
  LifeBuoy,
  Trash2,
} from "lucide-react";


export default function GroupsPage() {
  const [tenant, setTenant] = useState("");
  const [groups, setGroups] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [users, setUsers] = useState([]);
  const [superAdmin, setSuperAdmin] = useState(false);

  // Admin-only state
  const [groupName, setGroupName] = useState("");
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editGroups, setEditGroups] = useState({});

  /* -------- Tenant & Role -------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTenant(window.location.hostname.split(".")[0]);
      setSuperAdmin(isSuperAdmin());
    }
  }, []);

  /* -------- Load Data -------- */
  const loadData = async () => {
    const g = await apiClient("/api/groups/", { tenant });
    setGroups(Array.isArray(g) ? g : []);

    // Admin-only data
    if (superAdmin) {
      const d = await apiClient("/api/dashboards/", { tenant });
      const u = await apiClient("/api/users/", { tenant });
      setDashboards(d || []);
      setUsers(u || []);

      const edit = {};
      (g || []).forEach((grp) => {
        edit[grp.id] = {
          name: grp.name,
          dashboards:
            grp.dashboards?.map((d) => ({
              value: d.id,
              label: d.name,
            })) || [],
          users:
            grp.users?.map((u) => ({
              value: u.id,
              label: u.email,
            })) || [],
        };
      });
      setEditGroups(edit);
    }
  };

  useEffect(() => {
    if (tenant) loadData();
  }, [tenant, superAdmin]);

  /* -------- Admin CRUD -------- */
  const createGroup = async () => {
    if (!groupName.trim()) return;

    await apiClient("/api/groups/", {
      method: "POST",
      tenant,
      body: JSON.stringify({
        name: groupName,
        dashboards: selectedDashboards.map((d) => d.value),
        users: selectedUsers.map((u) => u.value),
      }),
    });

    setGroupName("");
    setSelectedDashboards([]);
    setSelectedUsers([]);
    loadData();
  };

  const updateGroup = async (id) => {
    const g = editGroups[id];
    if (!g) return;

    await apiClient(`/api/groups/${id}/`, {
      method: "PUT",
      tenant,
      body: JSON.stringify({
        name: g.name,
        dashboards: g.dashboards.map((d) => d.value),
        users: g.users.map((u) => u.value),
      }),
    });

    loadData();
  };

  const deleteGroup = async (id) => {
    if (!confirm("Move group to recycle bin?")) return;
    await apiClient(`/api/groups/${id}/`, {
      method: "DELETE",
      tenant,
    });
    loadData();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <UsersRound size={24} />
          Groups
        </h2>


        {superAdmin && (
            <Link
              href="/admin/groups/deleted"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <Trash2 size={20} />
              <span>Recycle Bin</span>
            </Link>
        )}
      </div>

      {/* ---------------- ADMIN CREATE ---------------- */}
      {superAdmin && (
        <div className="bg-white p-4 rounded shadow mb-8">
          <input
            className="border p-2 w-full mb-3"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <Select
            isMulti
            className="mb-3"
            placeholder="Select Dashboards..."
            value={selectedDashboards}
            onChange={setSelectedDashboards}
            options={dashboards.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
          />

          <Select
            isMulti
            className="mb-3"
            placeholder="Select Users..."
            value={selectedUsers}
            onChange={setSelectedUsers}
            options={users.map((u) => ({
              value: u.id,
              label: u.email,
            }))}
          />

          <button
            onClick={createGroup}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Group
          </button>
        </div>
      )}

      {/* ---------------- GROUP LIST ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) =>
          superAdmin ? (
            /* ---------- ADMIN CARD ---------- */
            <div key={g.id} className="bg-gray-100 p-4 rounded shadow">
              <input
                className="border p-2 w-full font-bold mb-2"
                value={editGroups[g.id]?.name || ""}
                onChange={(e) =>
                  setEditGroups((prev) => ({
                    ...prev,
                    [g.id]: { ...prev[g.id], name: e.target.value },
                  }))
                }
              />

              <Select
                isMulti
                value={editGroups[g.id]?.dashboards || []}
                onChange={(val) =>
                  setEditGroups((prev) => ({
                    ...prev,
                    [g.id]: { ...prev[g.id], dashboards: val },
                  }))
                }
                options={dashboards.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
              />

              <Select
                isMulti
                value={editGroups[g.id]?.users || []}
                onChange={(val) =>
                  setEditGroups((prev) => ({
                    ...prev,
                    [g.id]: { ...prev[g.id], users: val },
                  }))
                }
                options={users.map((u) => ({
                  value: u.id,
                  label: u.email,
                }))}
              />

              <div className="flex justify-between mt-2">
                <button
                  onClick={() => updateGroup(g.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteGroup(g.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* ---------- USER CARD ---------- */
            <div key={g.id} className="bg-white p-4 rounded shadow">
              <h2 className="font-bold text-lg mb-2">{g.name}</h2>

              <p className="text-sm text-gray-600 mb-1">
                Dashboards:
              </p>
              <ul className="list-disc ml-5 text-sm">
                {g.dashboards?.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
