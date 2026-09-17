# C.E.X — Project Analysis

> Cloud-based cryptocurrency exchange demo (centralized order book + wallet + auth).

## Tech Stack

- **Backend**: Bun + TypeScript, hand-rolled HTTP router (no Express), OOP / DI / SOLID, raw `pg` Pool (no ORM), `jsonwebtoken`, `bcryptjs`, EmailJS for OTP.
- **Frontend**: Next.js 15 (App Router) + React + TailwindCSS v4 + react-toastify, zod client validation, Context API (no Redux).
- **Communication**: REST (`:3010`) + WebSocket (`:3011`, singleton with auto-reconnect).
- **Tests**: `bun:test` (backend), Vitest + jsdom (frontend).

---

## What Has Been Done

### Backend

**Architecture**
- Layered design: `domain` (engine, events) → `http-layer` (routes, controllers, services, DTOs, middleware) → `infra` (db, store, logging, ws).
- Everything wired through constructor injection in the composition root (`http-layer/server.ts`).
- Interface-first contracts: `ITrade`, `IOrderBook`, `IMatchEngine`, `Iwallet`, `Ibalance`, `Iuser.store`, `Ibroadcast.orderbook`, `email-provider.interface`, `route.interface`.
- Event-driven order book: `EventManager` event-bus + `WebSocketBroadcaster` subscriber → pushes `ORDER_PLACED`, `ORDER_CANCELLED`, `TRADE_EXECUTED` to WS clients.

**Matching engine**
- `AbstractEngine` / `StandardEngine` with order validation, user-fund locking, and an atomic price–time priority match loop.
- Order book with bids/asks, LIMIT + MARKET order support, partial fills + statuses `OPEN | PARTIALLY_FILLED | FILLED | CANCELLED`.
- Wallet service with fund locking on order placement (`lockFunds` in a DB transaction).

**Auth**
- Register / login with bcrypt hashing + JWT (`7d` expiry).
- OTP request/verify flow (4-digit, 5-min expiry, in-memory Map store, sent via EmailJS).
- OAuth: Google + GitHub provider factory, `GET /api/auth/oauth`, callback, and providers endpoints.

**Persistence**
- Fully in-memory stores (orders, wallets, users) plus DB-backed implementations (`db-orderbook.store`, `db-wallet.store`, `db-user.store`).
- Postgres schema: `users`, `orders` (CHECK constraints, status enum), `balances`.
- Seeding script (`tests/seed/seed.ts`) with demo users `alice` (USD 1000) and `bob` (BTC 5).

**Endpoints**
- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`
- OAuth provider list / start / callback
- `POST /api/orders`, `POST /api/orders/add`, `DELETE /api/orders`
- `POST /api/balance/deposit`, `GET /api/balance/:userId`
- `GET /api/orderbook`

### Frontend

**Pages**
- Landing page, auth-guarded `dashboard` (candlestick-free trading grid: order form + order book + trade history + balance), `wallet` (deposit form + balance view), `login`, `register`, and `auth/callback` (OAuth redirect handling).

**Components**
- Reusable UI kit: `Button` (variants/sizes), `Badge`, `Input`, `Card`, `EmptyState`, `Skeleton`.
- Layout: `Header` (logo, BTC/USD badge, connection status, sign out), `Sidebar` (mobile overlay).
- Trading: `OrderForm` (side/type/symbol + zod validation), `OrderBook` (depth bars), `TradeHistory`, `BalanceDisplay`, `DepositForm` (presets 100/500/1000/5000).
- Provider tree: `AuthProvider` → `WebSocketProvider` → toast listener.

**State & connectivity**
- `UserContext`: reads `cex_auth_token` from localStorage, decodes JWT for userId.
- `WebSocketContext`: connection status, subscribe/unsubscribe, order sending.
- Hooks: `useOrders`, `useBalance`, `useOrderBook`, `useTradeHistory`, `useWebSocket`, `useWebSocketToasts`.
- Singleton WS service with reconnection + listener map; REST service wrapper around the API.

**Validation & formatting** (`src/utils`)
- zod schemas: `login`, `register`, `orderForm` (+ `superRefine` on qty/price), `deposit`.
- Formatters (`formatPrice`, etc.) and constants (`CURRENCIES`, `MAX_ORDER_PRICE/QUANTITY`, `MAX_DEPOSIT_AMOUNT`).

### Testing

- **Backend**: unit tests for engine, routes, OTP controller/service, order service, order controller, email service; integration `orderflow.test.ts` (in-memory infra); E2E `api.2e2.test.ts` (needs live `:3010` server).
- **Frontend**: Vitest suites for `schemas`, `Button`, `Badge`, `OrderForm`, `OrderBook`, `BalanceDisplay`, `TradeHistory` (API + WS mocked).

---

## Known Gaps / Bugs

1. **`getBalance` authorization gap** — only checks a valid token, doesn't verify the requested `:userId` matches the caller. The frontend's hard-coded `DEFAULT_USER_ID = "alice"` breaks whenever the logged-in user isn't alice.
2. **WS `sendToUser` broadcasts to *all* clients** — no per-user/per-chanel filtering (privacy/UX bug).
3. **Unused `Routes` class bug** — `order.routes.ts` wires `POST /api/balance/deposit` to `getBalance`; harmless only because `server.ts` hand-wires the correct route and ignores the class.
4. **`FileLogger` is a `console.log` stub** — real file logging not implemented (AGENTS.md violation); `WebSocketBroadcaster` uses `console.log`.
5. **`tradeId` type mismatch** — engine emits `crypto.randomUUID()` strings, payload types declare `number`.
6. **`TradeHistory` hardcodes side `"buy"`** — buy/sell side not derived from trade data.
7. **Frontend username hack** — `username` decoded from JWT `payload.email`.
8. **E2E suite blocked** — requires a manually started backend; two log files (`err.log`/`out.log`) track the run.

---

## What Can Be Done Next

### Fix correctness & security (highest priority)
- [ ] Enforce userId ownership in `getBalance` (match caller to target).
- [ ] Reduce WS broadcasts to the *authenticated* user only (map socket → user, filter in `sendToUser`).
- [ ] Implement a real `FileLogger` (or `pino`/`winston`-style) and replace `console.log` in the WS broadcaster — estate dependency injectable logger interface.
- [ ] Unify `tradeId` type (`string`) across engine events and payloads.
- [ ] Add rate limiting / request-body validation on auth + deposit + order routes.
- [ ] Add input sanitization on order quantity/price bounds server-side (not just zod client-side).

### Improve the matching engine & market depth
- [ ] Market orders with slippage / best-effort fill semantics and dedicated `MARKET` handling tests.
- [ ] Order cancellation releasing locked funds (currently lock/unlock path partial).
- [ ] Support multiple trading pairs (not just BTC/USD) — `CURRENCIES` already lists USD/BTC/ETH/USDT.
- [ ] Add candlestick / OHLC aggregation from `TRADE_EXECUTED` history (chart page currently missing — grid has no graph).
- [ ] Persist trade history + live ticks to DB; seed trade history for richer UI.

### Real infrastructure
- [ ] Migrate DB stores to the Postgres path end-to-end and add a docker-compose for Postgres.
- [ ] Add real migrations (currently raw schema; consider drizzle-kit or a lightweight migrator).
- [ ] Production WS: heartbeat/ping-pong, exponential backoff reconnect, presence, re-subscribe on reconnect.
- [ ] HTTPS + CORS tightening, and secure cookie-based JWT storage instead of `localStorage`.

### Frontend UX
- [x] Kill the `DEFAULT_USER_ID = "alice"` hack — use the logged-in user's id everywhere.
- [x] Fix `TradeHistory` side from data; add `Orders`, `History`, `Settings` pages (links currently all → `/dashboard`).
- [ ] Candlestick/price chart component (e.g., lightweight-charts) fed by WS ticks.
- [ ] Empty/loading/error states polish; skeleton + toast behavior is already good.
- [ ] PWA / desktop metadata, and a proper dark/light theme system (only `prefers-color-scheme` now).

### Testing & DX
- [ ] Make backend E2E self-contained (spawn server in `beforeAll`).
- [ ] Frontend: e2e or component tests for `Wallet`, `Sidebar`, header, auth flows.
- [ ] CI pipeline (GitHub Actions): lint + typecheck + unit + integration on both workspaces.
- [ ] Add `.env` provisioning + docs, and OpenAPI/Swagger for the REST API.

### Nice-to-have features
- [ ] Order/balance history endpoints + UI tables with filters/pagination.
- [ ] Webhook/polling fallback if WS not available.
- [ ] Admin panel: user list, order kills, market actions.
- [ ] Notifications: email OTP already flows through EmailJS — extend to trade/settlement emails.