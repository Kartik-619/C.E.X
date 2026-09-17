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
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
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
                href="/login"
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

      {/* MARKETS */}
      <section id="markets" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Markets that never sleep
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Live prices and 24h performance across leading pairs.
            </p>
          </div>

          <div className="mt-16 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-5 py-3.5 font-medium">Pair</th>
                  <th className="px-5 py-3.5 text-right font-medium">Last Price</th>
                  <th className="hidden px-5 py-3.5 text-right font-medium sm:table-cell">24h Change</th>
                  <th className="hidden px-5 py-3.5 text-right font-medium md:table-cell">24h Volume</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { pair: "BTC/USD", price: "$48,512.50", change: "+2.41%", up: true, volume: "$1.24B" },
                  { pair: "ETH/USD", price: "$2,841.30", change: "+1.85%", up: true, volume: "$892M" },
                  { pair: "SOL/USD", price: "$142.77", change: "-0.62%", up: false, volume: "$412M" },
                ].map((m) => (
                  <tr
                    key={m.pair}
                    className="border-b border-zinc-100 transition-colors last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900"
                  >
                    <td className="px-5 py-4 font-medium">{m.pair}</td>
                    <td className="px-5 py-4 text-right font-semibold">{m.price}</td>
                    <td
                      className={`hidden px-5 py-4 text-right font-medium sm:table-cell ${
                        m.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {m.change}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-zinc-600 dark:text-zinc-400 md:table-cell">{m.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built on security
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Your funds and data are protected at every layer.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Rotating API Keys",
                desc: "Every session uses short-lived credentials with full revocation control.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8-8M15 5l4 4" /><path d="M7.5 15.5h.01" /></svg>
                ),
              },
              {
                title: "Cold Wallet Storage",
                desc: "A majority of assets are held offline in multi-signature custody.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /></svg>
                ),
              },
              {
                title: "Real-time Monitoring",
                desc: "Anomaly detection and withdrawal safeguards run 24/7.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3m0 12v3M5.2 5.2l2.1 2.1m9.4 9.4 2.1 2.1M3 12h3m12 0h3M5.2 18.8l2.1-2.1m9.4-9.4 2.1-2.1" /><circle cx="12" cy="12" r="3" /></svg>
                ),
              },
              {
                title: "Encrypted at Rest",
                desc: "Sensitive data is encrypted with industry-standard algorithms.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>
                ),
              },
              {
                title: "Audited Matching Engine",
                desc: "The order engine is continuously tested and independently audited.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 5.5v5c0 5 3.8 9.5 9 11.5 5.2-2 9-6.5 9-11.5v-5Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
                ),
              },
              {
                title: "Strict Access Control",
                desc: "Role-based permissions and 2FA gate every privileged action.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18M3 11l3-6h12l3 6M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" /><path d="M9 17h.01M15 17h.01" /></svg>
                ),
              },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
                  {s.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{s.desc}</p>
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
              href="/login"
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
