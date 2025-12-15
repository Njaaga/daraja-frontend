"use client";

import Layout from "@/app/components/Layout";
import AuthGuard from "@/app/components/AuthGuard";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import Select from "react-select";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [users, setUsers] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [tenant, setTenant] = useState("");

  // ----------------------------
  // Detect tenant from subdomain
  // ----------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname; // e.g., client15.localhost
      setTenant(host.split(".")[0]);
    }
  }, []);

  // ----------------------------
  // Load groups + dashboards + users
  // ----------------------------
  const loadData = async () => {
    if (!tenant) return;

    try {
      const g = await apiClient("/api/groups/", { tenant });
      const d = await apiClient("/api/dashboards/", { tenant });
      const u = await apiClient("/api/users/", { tenant });

      setGroups(Array.isArray(g) ? g : []);
      setDashboards(Array.isArray(d) ? d : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (err) {
      console.error(err);
      logout(); // redirect to login if token invalid
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant]);

  // ----------------------------
  // Create group
  // ----------------------------
  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
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
    } catch (err) {
      console.error(err);
      logout();
    }
  };

  // ----------------------------
  // Delete group
  // ----------------------------
  const deleteGroup = async (id) => {
    try {
      await apiClient(`/api/groups/${id}/`, {
        method: "DELETE",
        tenant,
      });
      loadData();
    } catch (err) {
      console.error(err);
      logout();
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Groups</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-4">Create Group</h2>

        <input
          className="border p-2 w-full mb-4"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <label className="font-semibold">Assign Dashboards</label>
        <Select
          isMulti
          className="mb-4"
          value={selectedDashboards}
          onChange={setSelectedDashboards}
          options={dashboards.map((d) => ({
            value: d.id,
            label: d.name,
          }))}
        />

        <label className="font-semibold">Assign Users</label>
        <Select
          isMulti
          className="mb-4"
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
          Create
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-3">Existing Groups</h2>
      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-4 bg-gray-100 rounded flex justify-between"
          >
            <div>
              <p className="font-bold">{group.name}</p>
              <p className="text-sm text-gray-600">
                Dashboards: {group.dashboards?.length || 0} — Users:{" "}
                {group.users?.length || 0}
              </p>
            </div>

            <button
              onClick={() => deleteGroup(group.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
