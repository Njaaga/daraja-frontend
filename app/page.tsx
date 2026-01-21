export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top nav */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-xl font-bold">D</span>
            </div>
            <span className="font-semibold tracking-wide">Daraja</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-medium hover:bg-white/10 transition"
            >
              Login
            </a>
            <a
              href="/signup"
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:bg-white/90 transition"
            >
              Signup
            </a>
          </div>
        </header>

        {/* Hero section */}
        <main className="mt-16 grid gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Modern onboarding, <br />
              built for teams.
            </h1>
            <p className="text-zinc-300 text-lg">
              A simple, elegant platform for managing users, subscriptions, and
              workflows — all in one place.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="/signup"
                className="rounded-full bg-white text-black px-8 py-3 font-semibold hover:bg-white/90 transition"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10 transition"
              >
                Login
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full bg-white/10 px-4 py-2">
                No credit card required
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2">
                14-day free trial
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2">
                Built with Next.js & Django
              </span>
            </div>
          </section>

          {/* Right card */}
          <section className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Dashboard Preview</span>
              <span className="text-xs text-zinc-300">Live</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <span className="text-sm">1,240</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Subscriptions</span>
                  <span className="text-sm">684</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="text-sm">$12.8K</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Features */}
        <section className="mt-16 rounded-2xl bg-white/5 p-8 backdrop-blur">
          <h2 className="text-xl font-semibold">Built for teams</h2>
          <p className="text-zinc-300 mt-2">
            Everything you need to manage your app in one dashboard.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-5">
              <div className="font-semibold">User Management</div>
              <div className="text-zinc-300 text-sm mt-1">
                Invite, assign roles, and manage access.
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-5">
              <div className="font-semibold">Billing & Subscriptions</div>
              <div className="text-zinc-300 text-sm mt-1">
                Stripe-ready plans & invoices.
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-5">
              <div className="font-semibold">Analytics</div>
              <div className="text-zinc-300 text-sm mt-1">
                Track usage, growth, and revenue.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
