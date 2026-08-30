import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
              CX
            </span>
            <span className="text-lg font-semibold tracking-tight">C.E.X</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Features
            </a>
            <a href="#markets" className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Markets
            </a>
            <a href="#security" className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:block"
            >
              Sign in
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Institutional-grade order matching engine
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Trade with
              <span className="block">precise execution.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              C.E.X is a modern, minimalist crypto order-matching terminal. Place
              limit and market orders, watch the live order book, and track your
              balances in real time.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-zinc-700 hover:shadow-lg dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
              >
                Open the Dashboard
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-md border border-zinc-300 px-8 py-3.5 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-300 dark:hover:bg-zinc-800 sm:w-auto"
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Dashboard Preview Mock */}
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-zinc-200 shadow-2xl dark:border-zinc-800">
            <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="ml-4 text-xs text-zinc-400">cex.app/dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 sm:grid-cols-4">
              <div className="bg-white p-4 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">BTC/USD</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Buy</span>
                </div>
                <div className="mt-2 h-2 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-1.5 h-2 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="bg-white p-4 dark:bg-zinc-950">
                <span className="text-xs text-zinc-500">Balance</span>
                <div className="mt-2 text-2xl font-bold">$48,520</div>
                <div className="mt-1 text-xs text-zinc-400">Available</div>
              </div>
              <div className="bg-white p-4 dark:bg-zinc-950">
                <span className="text-xs text-zinc-500">Best Bid</span>
                <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">$48,512.50</div>
                <div className="mt-1 text-xs text-zinc-400">0.0042 BTC</div>
              </div>
              <div className="bg-white p-4 dark:bg-zinc-950">
                <span className="text-xs text-zinc-500">Best Ask</span>
                <div className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">$48,519.00</div>
                <div className="mt-1 text-xs text-zinc-400">0.0018 BTC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to trade
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              A focused set of tools, engineered for speed and clarity.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Live Order Book",
                desc: "Real-time bid and ask levels streamed over WebSocket with automatic reconnection.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-6 4 3 5-8" /></svg>
                ),
              },
              {
                title: "Limit & Market Orders",
                desc: "Place passive limit orders or aggressive market orders with strict validation.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h2m4 0h4M7 12h2m4 0h4M7 16h2" /></svg>
                ),
              },
              {
                title: "Balance Tracking",
                desc: "Monitor available, locked, and total balances across assets in real time.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                ),
              },
              {
                title: "Trade History",
                desc: "A clean, searchable ledger of executed trades and their details.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                ),
              },
              {
                title: "WebSocket Realtime",
                desc: "Instant order placement and trade execution events, built to never go stale.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                ),
              },
              {
                title: "Monochrome Design",
                desc: "A distraction-free, high-contrast interface optimized for long sessions.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-8 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start trading?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
              Jump into the live dashboard and experience the order flow.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-zinc-900 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
              CX
            </span>
            <span className="text-sm font-semibold">C.E.X</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} C.E.X. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
