"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { LifeBuoy, Database, BarChart3, Users, Settings, CreditCard, UsersRound } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const icons = [Database, BarChart3, Users, Settings, CreditCard, UsersRound];

export default function Home() {
  const [form, setForm] = useState<{ name: string; email: string; message: string }>({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient("/api/support-guest/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSuccess("Your message has been sent. We’ll get back to you shortly.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Define once as a constant
  const panelClasses = "flex items-start gap-2 p-4 rounded-xl bg-gradient-to-r from-white via-zinc-50 to-white border-l-4 border-blue-300 text-zinc-700";

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Top Nav */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">D</div>
            <span className="font-semibold tracking-wide">Daraja Reporting</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="rounded-full px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition">Login</a>
            <a href="/signup" className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-600/90 transition">Get Started</a>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-20 grid gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Reporting made simple. <br />Built for real teams.
            </h1>

            <p className="text-zinc-600 text-lg max-w-xl">
              Daraja is a reporting-first platform that helps teams turn distributed data into clear, shared insight — without BI complexity.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a href="/signup" className="rounded-full bg-blue-600 text-white px-8 py-3 font-semibold hover:bg-blue-600/90 transition">Start Reporting</a>
              <a href="/login" className="rounded-full border border-black/20 px-8 py-3 font-semibold text-zinc-800 hover:bg-zinc-100 transition">View Demo</a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-600">
              {["Reporting-first platform", "Built for teams & governance", "No BI complexity"].map((item) => (
                <span key={item} className="rounded-full bg-zinc-100 px-3 py-1.5">{item}</span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-zinc-50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-800">
              <LifeBuoy size={20} />
              Contact Support
            </h3>
            <p className="mt-2 text-sm text-zinc-600">Have a question or need help? Send us a message and we’ll respond shortly.</p>

            {success && <div className="mt-4 rounded bg-green-100 p-3 text-sm text-green-700">{success}</div>}
            {error && <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input type="text" name="name" placeholder="Your name" required value={form.name} onChange={handleChange} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
              <input type="email" name="email" placeholder="Your email" required value={form.email} onChange={handleChange} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
              <textarea name="message" rows={4} placeholder="How can we help?" required value={form.message} onChange={handleChange} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
              <button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600/90 disabled:opacity-50">
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>
        </main>

        {/* What the App Does */}
        <section className="mt-24">
          <h2 className="text-2xl font-semibold">What the Daraja Reporting Platform Does</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Centralizes data from multiple sources",
              "Creates clear, shareable dashboards",
              "Keeps reporting consistent across teams",
              "Controls access with built-in governance",
              "Scales as your organization grows",
            ].map((item, idx) => {
              const Icon = icons[idx % icons.length];
              return (
                <div key={item} className={panelClasses}>
                  <Icon size={20} className="text-blue-400 mt-1"/>
                  <p className="ml-1">{item}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Built For */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Built For</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Business leaders", "Operations teams", "Analysts", "Growing organizations"].map((role, idx) => {
              const Icon = icons[idx % icons.length];
              return (
                <div key={role} className={panelClasses}>
                  <Icon size={20} className="text-blue-400 mt-1"/>
                  <p className="ml-1">{role}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Different */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Why Daraja Is Different</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Reporting First", text: "Designed specifically for reporting — not a generic BI tool." },
              { title: "Simple by Design", text: "Easy to use, easy to understand, and easy to share." },
              { title: "All-in-One Platform", text: "One reporting application instead of many disconnected tools." },
              { title: "Built for Decisions", text: "Focused on clarity and understanding — not just charts." },
            ].map(({ title, text }, idx) => {
              const Icon = icons[idx % icons.length];
              return (
                <div key={title} className={panelClasses}>
                  <div className="flex items-center gap-2">
                    <Icon size={20} className="text-blue-400"/>
                    <h3 className="font-semibold text-zinc-800">{title}</h3>
                  </div>
                  <p className="ml-7 mt-1 text-sm text-zinc-600">{text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-24 border-t border-black/10 pt-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} Daraja Reporting Platform. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
