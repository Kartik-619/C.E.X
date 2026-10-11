import React from "react";
import { Card } from "@/components/ui/card/Card";

interface Topic {
  title: string;
  body: string;
}

const TOPICS: Topic[] = [
  {
    title: "Price–time matching engine",
    body: "Orders are matched with strict price–time priority: the best price wins, and ties are broken FIFO. The book is updated atomically so two orders can never fill against the same resting liquidity.",
  },
  {
    title: "Limit & market orders",
    body: "A LIMIT order rests in the book and matches at its price; a MARKET order matches immediately against the best available levels. Partial fills are supported — any unfilled remainder stays live in the book.",
  },
  {
    title: "Order lifecycle",
    body: "Orders progress through OPEN → PARTIALLY_FILLED → FILLED, or become CANCELLED. Every transition is recorded so the Orders and History pages always reflect the true state.",
  },
  {
    title: "Balances & fund locking",
    body: "On placement, the quote currency is locked for buys and the base currency for sells, so funds can't be spent twice. Cancellations and fills release the locked amounts back to your available balance.",
  },
  {
    title: "Live order book & trades",
    body: "The order book and trade history are streamed over a single WebSocket connection. There is no polling — when an order is placed, cancelled, or a trade executes, the UI updates instantly.",
  },
  {
    title: "Authentication & security",
    body: "Passwords are hashed with bcrypt and sessions use short-lived JWTs (7 days). Email OTP verification is available on sensitive actions to keep your account secure.",
  },
];

const STEPS: Topic[] = [
  {
    title: "Create an account",
    body: "Register with an email and password, or continue with Google / GitHub.",
  },
  {
    title: "Fund your wallet",
    body: "Head to the Wallet page and deposit the asset you want to trade.",
  },
  {
    title: "Place an order",
    body: "Use the Dashboard order form to place a limit or market order at your price.",
  },
  {
    title: "Track in real time",
    body: "Watch the order book and trade history update live as the engine matches orders.",
  },
];

export const AboutContent: React.FC = () => {
  return (
    <div className="space-y-10">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          About C.E.X
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          How C.E.X works
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          C.E.X is a centralized crypto exchange built around an order-book
          matching engine, per-user wallets with fund locking, and a live
          WebSocket feed. This page explains what happens behind the buttons —
          from the moment you place an order to the moment it fills.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">The essentials</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <Card key={topic.title} header={<h3 className="text-sm font-semibold">{topic.title}</h3>}>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {topic.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Order status flow</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          An order moves through these states as the engine works through it.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            OPEN
          </span>
          <span className="text-zinc-400">→</span>
          <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            PARTIALLY_FILLED
          </span>
          <span className="text-zinc-400">→</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            FILLED
          </span>
          <span className="text-zinc-400">or</span>
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            CANCELLED
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Getting started</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
