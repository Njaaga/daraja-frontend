export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top Nav */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
              D
            </div>
            <span className="font-semibold tracking-wide">Daraja</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-medium hover:bg-black/5 transition"
            >
              Login
            </a>
            <a
              href="/signup"
              className="rounded-full bg-black text-white px-5 py-2 text-sm font-medium hover:bg-black/90 transition"
            >
              Signup
            </a>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-20 grid gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Simple. Secure. <br />
              Built for modern teams.
            </h1>

            <p className="text-zinc-600 text-lg max-w-xl">
              Manage users, subscriptions, and analytics in one powerful
              platform designed for speed and clarity.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="/signup"
                className="rounded-full bg-black text-white px-8 py-3 font-semibold hover:bg-black/90 transition"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="rounded-full border border-black/20 px-8 py-3 font-semibold hover:bg-black/5 transition"
              >
                Login
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                No credit card required
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                Free trial included
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                Next.js + Django backend
              </span>
            </div>
          </section>

          {/* Preview Card */}
          <section className="rounded-2xl border border-black/10 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Live Overview</span>
              <span className="text-xs text-zinc-500">Today</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <span className="text-sm font-semibold">1,240</span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Active Subscriptions
                  </span>
                  <span className="text-sm font-semibold">684</span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Revenue</span>
                  <span className="text-sm font-semibold">$12.8K</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Features */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Everything you need</h2>
          <p className="text-zinc-600 mt-2 max-w-xl">
            Built to scale with your business, from day one.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">User Management</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Invite users, assign roles, and control access easily.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">Billing & Subscriptions</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Stripe-powered plans, invoices, and payments.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Real-time insights into growth and usage.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-black/10 pt-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} Daraja. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
