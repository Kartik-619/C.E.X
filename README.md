# C.E.X — Cloud-based Crypto Exchange Demo

A centralized cryptocurrency exchange demo: order-book matching engine, per-user wallets with fund locking, JWT + OTP authentication, OAuth (Google / GitHub), a live WebSocket feed, and a React dashboard to trade against it.

The project is a **monorepo with two workspaces**:

| Path        | What it is                                                        |
| ----------- | ----------------------------------------------------------------- |
| `backend/`  | Bun + TypeScript trading engine, REST API (`:3010`) and WebSocket server (`:3011`) |
| `frontend/` | Next.js (App Router) trading dashboard that talks to the backend  |

> Feature/roadmap/known-gaps tracking lives in [`analysis.md`](./analysis.md). Agent coding rules live in [`backend/agents.MD`](./backend/agents.MD) and [`frontend/AGENTS.md`](./frontend/AGENTS.md).

---

## Features

**Backend (`backend/`)**
- Hand-rolled HTTP router (no Express) with OOP / dependency-injection / SOLID layering:
  `domain` (engine + events) → `http-layer` (routes, controllers, services, DTOs, middleware) → `infra` (db, store, logging, ws).
- Price–time priority matching engine with **LIMIT** and **MARKET** orders, partial fills, and order statuses `OPEN | PARTIALLY_FILLED | FILLED | CANCELLED`.
- Atomic order-book matching and atomic fund locking (`orderbook-store.atomicMatch`, `wallet-store.tryLockFunds`) — guarded against TOCTOU races.
- Event-driven architecture: the engine publishes domain events on an in-process `EventManager` bus; a `WebSocketBroadcaster` subscriber pushes them to clients.
- Auth: register / login (bcrypt + JWT, 7-day expiry), 4-digit OTP request/verify via EmailJS, and OAuth 2.0 with Google + GitHub.
- Persistence: fully in-memory stores by default, or PostgreSQL-backed stores toggled with `USE_DB=true` (auto-migrates `users`, `orders`, `balances`, `trades`).
- Seed data: demo wallets for `alice` (1000 USD) and `bob` (5 BTC).

**Frontend (`frontend/`)**
- Next.js 16 App Router + React 19 + Tailwind CSS v4, TypeScript strict, zod client-side validation.
- Auth-guarded pages: `Dashboard` (order form + order book + trade history + balances), `Wallet` (balances + deposit presets), `Orders`, `History`, and `Settings`. Public pages: landing, `login`, `register`, OAuth `auth/callback`.
- Reusable UI kit: `Button`, `Badge`, `Input`, `Card`, `EmptyState`, `Skeleton`.
- Singleton WebSocket service with auto-reconnect + listener map; all HTTP routed through the `TradingAPI` service layer.
- Context providers: `AuthProvider` → `WebSocketProvider` → toast listener.

---

## Tech Stack

| Layer        | Technology                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| Runtime      | [Bun](https://bun.com) (backend), Node.js ≥ 20.9 (frontend build)          |
| Backend      | TypeScript, hand-rolled router, `elysia` (CORS/JWT helpers), `jsonwebtoken`, `bcrypt`, `pg` (raw, no ORM), `ws` |
| Frontend     | Next.js 16.2.12 (App Router), React 19.2.4, Tailwind CSS v4, zod 4, react-toastify 11 |
| Email / OTP  | EmailJS (`@emailjs/browser`-based provider)                                 |
| Tests        | `bun:test` (backend), Vitest + jsdom + Testing Library (frontend)           |
| Storage      | In-memory (default) or PostgreSQL (opt-in)                                  |

---

## Repository Layout

```
C.E.X/
├── backend/                      # Bun + TS trading engine & API
│   ├── index.ts                  # Entry point → imports src/http-layer/server
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── domain/               # Core business logic (no external deps)
│       │   ├── engine/
│       │   │   ├── services/     # StandardEngine, OrderBook, Wallet
│       │   │   └── interface/    # IOrderBook, IWallet, IMatchEngine, ITrade, Ibalance
│       │   ├── events/           # EventManager bus, payloads, WS broadcaster
│       │   └── auth/             # User model, OAuth provider definitions
│       ├── http-layer/           # REST layer
│       │   ├── controllers/      # Auth/Order/OTP/OAuth controllers
│       │   ├── dto/              # Request/response DTOs
│       │   ├── routes/           # Route table definitions
│       │   ├── service/          # OrderService, AuthService, OtpService, EmailService
│       │   ├── middleware/       # AuthMiddleware (JWT → AuthContext)
│       │   └── server.ts         # Composition root + manual routing + ports
│       ├── infra/                # Concrete infra
│       │   ├── auth/             # bcrypt, JWT, OTP, OAuth providers
│       │   ├── db/               # pg pool, connection, schema/migrations
│       │   ├── logging/          # Logger, LoggerFactory, LogLevel
│       │   ├── store/            # In-memory + db* store impls
│       │   └── ws/               # WebsocketServer (broadcast / sendToUser)
│       └── tests/
│           ├── unit/             # Unit tests per module
│           ├── integration/      # orderflow.test.ts, api.2e2.test.ts
│           ├── seed/             # seedDatabase()
│           └── fixtures/         # Shared test data
├── frontend/                     # Next.js trading dashboard
│   ├── app/                      # App Router pages & routing
│   │   ├── page.tsx              # Landing page
│   │   ├── login/ register/ auth/callback/
│   │   ├── dashboard/ wallet/ orders/ history/ settings/
│   │   └── layout.tsx            # Providers + global layout
│   └── src/
│       ├── components/
│       │   ├── ui/               # Button, Badge, Input, Card, EmptyState, Skeleton
│       │   ├── trading/          # OrderForm, OrderBook, TradeHistory, BalanceDisplay, DepositForm
│       │   └── layout/           # Header, Sidebar, Providers
│       ├── context/              # UserContext (auth), WebSocketContext
│       ├── hooks/                # useBalance, useOrders, useOrderBook, useTradeHistory,
│       │                         # useUserOrders, useActivityHistory, useWebSocket, useWebSocketToasts
│       ├── services/             # api.ts (REST), websocket.ts (WS singleton)
│       ├── types/                # Api types, WebSocket message types
│       └── utils/                # zod schemas, formatters, constants
└── analysis.md                   # Project analysis, known gaps & roadmap
```

---

## Prerequisites

- **Bun** ≥ 1.3 (backend runtime + test runner). Install: `curl -fsSL https://bun.sh/install | bash` (or `npm i -g bun`).
- **Node.js** ≥ 20.9 (frontend build tooling; `npm` used for scripts).
- **PostgreSQL** — only if you enable DB-backed stores (`USE_DB=true`). Optional for the default in-memory mode.

---

## Getting Started

### 1. Backend

```bash
cd backend
bun install          # install dependencies
bun run index.ts     # start REST API on :3010 and WebSocket on :3011
```

Startup will print the registered routes, e.g.:

```
Server running on http://localhost:3010
Storage: In-Memory
Endpoints:
  POST   /api/auth/register          - Register a new user
  POST   /api/auth/login             - Login
  POST   /api/auth/otp/request      - Request OTP via email
  POST   /api/auth/otp/verify        - Verify OTP
  GET    /api/auth/oauth              - Initiate OAuth flow
  ...
  GET    /api/orderbook               - Get order book
  GET    /api/health                  - Health check
WebSocket running on ws://localhost:3011
```

With the default in-memory stores, no database is needed. Wallets are seeded for demo users `alice` (USD 1000) and `bob` (BTC 5).

### 2. Frontend

```bash
cd frontend
npm install          # or: bun install
npm run dev          # start Next.js on http://localhost:3000
```

The defaults already target the local backend (`http://localhost:3010/api`, `ws://localhost:3011`), so no env file is required. If you run the services on other hosts, create `frontend/.env.local` with `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` (see below).

Open **http://localhost:3000**, register an account (or log in as an OAuth user), then use **Dashboard** to place orders and **Wallet** to deposit funds.

### 3. Environment variables

**Backend** — copy `backend/.env.example` (a blank template) and fill in values from the table, or export them in your shell:

| Variable                | Default                                | Purpose                                   |
| ----------------------- | -------------------------------------- | ----------------------------------------- |
| `USE_DB`                | `false`                                | `true` → use PostgreSQL stores, else in-memory |
| `DB_HOST`               | `localhost`                            | Postgres host                             |
| `DB_PORT`               | `5432`                                 | Postgres port                             |
| `DB_NAME`               | `cex`                                  | Postgres database name                    |
| `DB_USER`               | `postgres`                             | Postgres user                             |
| `DB_PASSWORD`           | `postgres`                             | Postgres password                          |
| `JWT_SECRET`            | `your-secret-key`                      | JWT signing secret (use a strong value in production) |
| `FRONTEND_URL`          | `http://localhost:3000`                | OAuth redirect target after callback      |
| `EMAIL_SERVICE_ID`      | *(empty)*                              | EmailJS service ID                        |
| `EMAIL_TEMPLATE_ID`     | *(empty)*                              | EmailJS OTP template ID                   |
| `EMAIL_PUBLIC_KEY`      | *(empty)*                              | EmailJS public key                        |
| `EMAIL_SERVICE_KEY`     | *(empty)*                              | EmailJS private/restricted key            |
| `EMAIL_FROM_NAME`       | `CEX Support`                          | Sender display name                       |
| `OAUTH_PROVIDER`        | *(empty)*                              | Comma-separated enabled providers (e.g. `google,github`) |
| `OAUTH_REDIRECT_URI`    | `http://localhost:3010/api/auth/oauth/callback` | OAuth callback URI           |
| `GOOGLE_CLIENT_ID`      | *(empty)*                              | Google OAuth app client ID                |
| `GOOGLE_CLIENT_SECRET`  | *(empty)*                              | Google OAuth app client secret            |
| `GITHUB_CLIENT_ID`      | *(empty)*                              | GitHub OAuth app client ID                |
| `GITHUB_CLIENT_SECRET`  | *(empty)*                              | GitHub OAuth app client secret            |

**Frontend** — create `frontend/.env.local` (server default is `http://localhost:3010/api`):

| Variable                 | Default                   | Purpose                          |
| ------------------------ | ------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`    | `http://localhost:3010/api` | REST base URL (no trailing `/`) |
| `NEXT_PUBLIC_WS_URL`     | `ws://localhost:3011`      | WebSocket URL                    |

---

## REST API Reference

Base URL: `http://localhost:3010` (`http://localhost:3010/api` for the endpoints below). All responses are JSON. Endpoints marked **(auth)** require `Authorization: Bearer <token>`.

| Method | Path                        | Auth | Description                                  |
| ------ | --------------------------- | ---- | -------------------------------------------- |
| GET    | `/api/health`               | –    | Health check (`{ status, storage }`)         |
| POST   | `/api/auth/register`        | –    | Register `{ email, username, password }` → `{ user, token }` |
| POST   | `/api/auth/login`           | –    | Login `{ email, password }` → `{ user, token }` |
| POST   | `/api/auth/otp/request`     | –    | Request a 4-digit OTP code                   |
| POST   | `/api/auth/otp/verify`      | –    | Verify an OTP code                           |
| GET    | `/api/auth/oauth`           | –    | Start OAuth flow `?provider=google|github`   |
| GET    | `/api/auth/oauth/callback`  | –    | OAuth provider callback                      |
| GET    | `/api/auth/oauth/providers` | –    | List enabled OAuth providers                 |
| GET    | `/api/orderbook`            | –    | Order-book snapshot `{ bids, asks }`         |
| GET    | `/api/orders`               | ✓    | List the **current user's** open orders      |
| POST   | `/api/orders`               | ✓    | Place an order `{ symbol, side, price, quantity, type }` |
| POST   | `/api/orders/add`           | ✓    | Add a passive order to the book              |
| DELETE | `/api/orders`               | ✓    | Cancel an order `{ orderId }`                |
| GET    | `/api/balance/:userId`      | ✓    | Balances for a user                         |
| POST   | `/api/balance/deposit`      | ✓    | Deposit `{ asset, amount }` into caller's wallet |

### Order request shape

```jsonc
{
  "userId": "alice",        // ignored by the API for authenticated users
  "symbol": "BTC/USD",
  "side": "buy",            // "buy" | "sell"
  "price": 48000,           // optional for MARKET
  "quantity": 0.5,
  "type": "LIMIT"           // "LIMIT" | "MARKET" (default LIMIT)
}
```

### Order statuses

`OPEN` → (`PARTIALLY_FILLED`) → `FILLED` | `CANCELLED`

---

## WebSocket Reference

URL: `ws://localhost:3011`

Messages are `{ type, data }`. The singleton frontend service auto-reconnects and dispatches each `type` to registered listeners.

| Event              | Scope    | Data highlights                                 |
| ------------------ | -------- | ------------------------------------------------ |
| `ORDER_PLACED`     | broadcast | `orderId`, `userId`, `symbol`, `side`, `price`, `quantity`, `status`, `timestamp` |
| `TRADE_EXECUTED`   | broadcast | `tradeId`, `buyOrderId`, `sellOrderId`, `buyerId`, `sellerId`, `symbol`, `price`, `quantity`, `totalValue`, `timestamp` |
| `ORDER_FILLED`     | user     | `orderId`, `userId`, `price`, `quantity`, `status: "FILLED"` |
| `ORDER_CANCELLED`  | user     | `orderId`, `userId`, `symbol`, `side`, `status: "CANCELLED"` |
| `ORDER_PENDING`    | user     | `orderId`, `userId`, `timestamp`                  |
| `ORDER_FAILED`     | user     | `orderId`, `userId`, `reason`, `required`, `available` |
| `OTPASKED`         | user     | `userId`, `timestamp`                             |
| `OTP_FAILED`       | user     | `userId`, `timestamp`                             |

---

## Authentication & Sessions

- Passwords are hashed with **bcrypt**; successful login/register returns a **JWT** (7-day expiry) signed with `JWT_SECRET`.
- The frontend stores the token in `localStorage` under `cex_auth_token` and sends it as `Authorization: Bearer <token>` on every API call.
- The token payload carries `{ userId, email }`; the dashboard derives the logged-in user id from it (no hard-coded defaults).
- **OTP**: `POST /api/auth/otp/request` emails a 4-digit code (5-min validity, in-memory store). `verify` consumes it.
- **OAuth**: Google + GitHub provider factory. `GET /api/auth/oauth?provider=google` redirects; the callback exchanges the code, upserts the user, and redirects back to `FRONTEND_URL`.

---

## Database (opt-in)

With `USE_DB=true`, the server runs a **synchronous auto-migration** on startup (`src/infra/db/schema.ts`) and uses the `db-*` store implementations:

- `users` — id, username, unique email, password hash (NULL for OAuth-only), provider, created/updated timestamps.
- `orders` — order id, user, side (`buy`/`sell`), price > 0, quantity ≥ 0, type (`LIMIT`/`MARKET`), symbol, status enum with CHECK constraint, created at; indexed on side/price, symbol, user, status.
- `balances` — composite PK `(user_id, asset)`, available/locked with non-negative CHECKs.
- `trades` — id, buy/sell order ids, buyer/seller ids, symbol, price, quantity, total value, created at.

The **default is fully in-memory** (no Postgres required) — swap stores simply by changing `USE_DB`.

---

## Trading Engine Semantics

- **Matching**: price–time priority (best price first, then FIFO). Bids/asks are matched atomically to prevent TOCTOU race conditions.
- **Order types**: `LIMIT` (rests in the book / matches at its price) and `MARKET` (matches immediately against the book).
- **Fund locking**: on placement, quote currency is locked for buys and base currency for sells (`tryLockFunds`); balances are released on cancellation/fill.
- **Statuses**: an order that partially fills keeps the remainder in the book as `PARTIALLY_FILLED`; fully consumed orders become `FILLED`; cancelled orders become `CANCELLED`.
- **Events**: every state change emits a domain event that the WebSocket broadcaster forwards to clients — the UI updates live without polling.

---

## Testing

### Backend (`bun:test`)

```bash
cd backend
bun test src/tests/unit/ src/tests/integration/orderflow.test.ts   # unit + integration (no server needed)
bun test                                                           # full suite incl. E2E
```

> The E2E suite (`api.2e2.test.ts`) expects a **live backend on `:3010`** — start `bun run index.ts` in another terminal first, or it will fail fast. `err.log` / `out.log` at the repo root capture server output during E2E runs.

### Frontend (Vitest)

```bash
cd frontend
npm test          # vitest run
npm run lint      # eslint (flat config)
npx tsc --noEmit  # strict typecheck
```

---

## Useful Scripts

| Task              | Command (backend)              | Command (frontend)     |
| ----------------- | ------------------------------ | ---------------------- |
| Install deps      | `bun install`                  | `npm install`          |
| Run dev           | `bun run index.ts`             | `npm run dev`          |
| Production build  | –                              | `npm run build`        |
| Serve build       | –                              | `npm start`            |
| Tests             | `bun test`                     | `npm test`             |
| Lint              | (n/a)                          | `npm run lint`         |
| Typecheck         | `bunx tsc --noEmit`            | `npx tsc --noEmit`     |

---

## Known Limitations

Tracked in detail in [`analysis.md`](./analysis.md). Highlights:

1. `GET /api/balance/:userId` doesn't verify the requested user matches the caller's token — mitigated client-side for now (the previous hard-coded `alice` default has been removed).
2. WS private events (`ORDER_FILLED`, `ORDER_FAILED`, `ORDER_CANCELLED`, `OTPASKED`, …) are now scoped to the authenticated user: the client connects with its JWT (`?token=…`) and `sendToUser` delivers only to that user's sockets. (Resolved — previously broadcast to everyone.)
3. The `Routes` class in `order.routes.ts` is a stub superseded by manual routing in `server.ts`.
4. `FileLogger` is a `console.log` stub; real file logging not implemented.
5. E2E suite requires a manually started server.
6. Single trading pair (`BTC/USD`) supported end-to-end; OTP email requires EmailJS configuration.

---

## Roadmap

The roadmap, checklist, and "what's next" are maintained as a living document in [`analysis.md`](./analysis.md) — including correctness/security fixes (WS per-user filtering, balance ownership, rate limiting), market-depth work (candlesticks, multiple pairs), and infrastructure hardening (Docker + Postgres, CI pipeline, real migrations).

---

## License

Private / unlicensed demo project. No public license is implied.