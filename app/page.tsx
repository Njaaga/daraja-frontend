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
            <span className="font-semibold tracking-wide">
              Daraja Reporting
            </span>
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
              Get Started
            </a>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-20 grid gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Reporting made simple. <br />
              Built for real teams.
            </h1>

            <p className="text-zinc-600 text-lg max-w-xl">
              Daraja is an all-in-one reporting application that helps teams
              turn data into clear, shared reports — without complexity.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="/signup"
                className="rounded-full bg-black text-white px-8 py-3 font-semibold hover:bg-black/90 transition"
              >
                Start Reporting
              </a>
              <a
                href="/login"
                className="rounded-full border border-black/20 px-8 py-3 font-semibold hover:bg-black/5 transition"
              >
                View Demo
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                Reporting-first platform
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                Built for teams & governance
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                No BI complexity
              </span>
            </div>
          </section>

          {/* Preview Card */}
          <section className="rounded-2xl border border-black/10 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Reporting Overview</span>
              <span className="text-xs text-zinc-500">Live</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Data Sources Connected
                  </span>
                  <span className="text-sm font-semibold">8</span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Active Reports
                  </span>
                  <span className="text-sm font-semibold">42</span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Teams Using Reports
                  </span>
                  <span className="text-sm font-semibold">6</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* What the App Does */}
        <section className="mt-24">
          <h2 className="text-2xl font-semibold">
            What the Daraja Reporting Platform Does
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Centralizes data from multiple sources",
              "Creates clear, shareable dashboards",
              "Keeps reporting consistent across teams",
              "Controls access with built-in governance",
              "Scales as your organization grows",
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/10 p-6 text-sm text-zinc-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Built For */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Built For</h2>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {[
              "Business leaders",
              "Operations teams",
              "Analysts",
              "Growing organizations",
            ].map((role) => (
              <span
                key={role}
                className="rounded-full bg-zinc-100 px-4 py-2"
              >
                {role}
              </span>
            ))}
          </div>
        </section>

        {/* Why Different */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">
            Why Daraja Is Different
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">
                Reporting First
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Designed specifically for reporting — not a generic BI tool.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">
                Simple by Design
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Easy to use, easy to understand, and easy to share.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">
                All-in-One Platform
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                One reporting app instead of many disconnected tools.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 p-6">
              <h3 className="font-semibold">
                Built for Decisions
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Focused on clarity and understanding — not just charts.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-black/10 pt-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} Daraja Reporting Platform. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
