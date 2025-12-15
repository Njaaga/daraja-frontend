"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      setToken(t);
    }
  }, []);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/`, authHeaders);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setStatus("Failed to fetch users");
    }
  };

  const inviteUser = async () => {
    if (!firstName || !lastName || !email) {
      setStatus("All fields are required");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/users/invite/`,
        { first_name: firstName, last_name: lastName, email },
        authHeaders
      );
      setStatus(res.data.message || "Invitation sent");
      setFirstName("");
      setLastName("");
      setEmail("");
      fetchUsers();
    } catch (err) {
      console.error(err.response?.data || err);
      setStatus("Failed to send invitation");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}/`, authHeaders);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setStatus("Failed to delete user");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const validRows = rows.filter((r) => r.first_name && r.last_name && r.email);

      if (validRows.length === 0) {
        setStatus("No valid user data found in Excel file");
        return;
      }

      const res = await axios.post(`${API_URL}/users/bulk_invite/`, { users: validRows }, authHeaders);
      setStatus(res.data.message || "Users uploaded successfully");
      fetchUsers();
    } catch (err) {
      console.error(err);
      setStatus("Failed to upload users from Excel");
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-xl font-bold mb-4">Manage Users</h2>
      {status && <p className="mb-4 text-red-600">{status}</p>}

      {/* Single Invite */}
      <div className="mb-6 flex flex-col gap-2 w-80">
        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="p-2 border rounded" />
        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="p-2 border rounded" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded" />
        <button onClick={inviteUser} className="bg-blue-600 text-white p-2 rounded mt-2">Send Invitation</button>
      </div>

      {/* Excel Upload */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Upload Users via Excel:</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="p-2 border rounded" />
      </div>

      {/* Existing Users */}
      <h3 className="text-lg font-semibold mb-2">Existing Users</h3>
      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between p-2 border rounded">
            <div>{u.first_name} {u.last_name} — {u.email}</div>
            <button onClick={() => deleteUser(u.id)} className="bg-red-600 text-white p-1 rounded">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
