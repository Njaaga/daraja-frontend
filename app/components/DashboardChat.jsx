"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";

export default function DashboardChat({ dashboardId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const loadMessages = async () => {
    if (!dashboardId) return;
    try {
      const res = await axiosClient.get(`/dashboards/${dashboardId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      await axiosClient.post(`/dashboards/${dashboardId}/messages/`, { text });
      setText("");
      loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [dashboardId]);

  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Dashboard Chat</h3>

      <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 5 }}>
            <strong>{msg.user?.username || "User"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={sendMessage} style={{ padding: 8 }}>
        Send
      </button>
    </div>
  );
}
