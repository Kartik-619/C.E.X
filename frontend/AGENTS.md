FRONTEND SUMMARY — NEXT.JS TRADING DASHBOARD

The frontend is a Next.js 16.2.12 App Router trading dashboard using React 19.2.4, Tailwind CSS v4, TypeScript v5, and a Bun.js backend API.

CORE ARCHITECTURE:
- All backend communication MUST go through the TradingAPI service.
- API URLs MUST come from environment variables; never hardcode URLs in components.
- API requests must have proper loading and error states.
- All API requests/responses must be strictly typed.
- Never use fetch directly inside React components.
- WebSocket communication must go through the WebSocket service, with automatic reconnection and connection-error handling.
- Avoid creating multiple WebSocket connections.

COMPONENT RULES:
- Use functional React components with hooks.
- Keep components small, focused, and single-purpose.
- Separate container logic from presentational UI.
- Put reusable/complex logic into custom hooks.
- Never use class components.
- Never put business logic directly inside components.
- Avoid giant/monolithic components.

STATE MANAGEMENT:
- Prefer React hooks: useState, useEffect, useContext, etc.
- Use custom hooks for complex state logic.
- Use React Context for global state such as theme/user state.
- Avoid Redux unless absolutely necessary.
- Do not prop-drill more than 2 levels.
- Never mutate React state directly.
- Clean up subscriptions properly.

TYPE SAFETY:
- Type ALL props, state, API requests, and API responses.
- Use `interface` for object structures and `type` for unions.
- Keep shared types in `src/types/`.
- Avoid `any` unless absolutely necessary.
- Never use @ts-ignore or @ts-expect-error.
- Never skip API response type checking.

DIRECTORY STRUCTURE:
frontend/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css
│   └── api/                # API routes if needed
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── trading/            # OrderForm, OrderBook, BalanceDisplay, TradeHistory
│   └── layout/             # Header, Footer
├── hooks/                  # Custom React hooks
│   ├── useWebSocket.ts
│   ├── useOrders.ts
│   ├── useBalance.ts
│   └── useOrderBook.ts
├── services/
│   ├── api.ts              # HTTP API client / TradingAPI
│   └── websocket.ts        # WebSocket service
├── types/
│   ├── api.ts              # API request/response types
│   ├── websocket.ts        # WebSocket message types
│   └── index.ts
├── utils/
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators.ts
├── context/
│   ├── WebSocketContext.tsx
│   └── UserContext.tsx
└── styles/
    └── globals.css

SERVICE ARCHITECTURE:
- `services/api.ts` is the ONLY layer components use for HTTP backend communication.
- TradingAPI should handle API calls, request/response typing, consistent errors, and API configuration.
- API base URL comes from `NEXT_PUBLIC_API_URL`.
- WebSocket URL comes from `NEXT_PUBLIC_WS_URL`.
- `services/websocket.ts` manages the WebSocket connection, reconnection, and connection errors.
- Components should consume services through hooks rather than implementing networking themselves.

ENVIRONMENT VARIABLES:
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001

BACKEND ENDPOINTS:
POST   /api/orders             → Place active order
POST   /api/orders/add         → Add passive order
DELETE /api/orders             → Cancel order
GET    /api/balance/:userId    → Get balance
GET    /api/orderbook          → Get order book
GET    /api/health             → Health check

WEBSOCKET EVENTS:
ORDER_PLACED      → Public: new order placed
TRADE_EXECUTED    → Public: trade executed
ORDER_FILLED      → Private: order filled
ORDER_CANCELLED   → Private: order cancelled

IMPORTANT TYPES:
OrderRequest:
- userId: string
- symbol: string
- side: 'buy' | 'sell'
- price: number
- quantity: number
- type?: 'LIMIT' | 'MARKET'

OrderResponse:
- id
- userId
- symbol
- side
- price
- quantity
- status
- totalValue
- createdAt

BalanceResponse:
- userId
- asset
- available
- locked
- total

CUSTOM HOOK PATTERN:
- Hooks such as useBalance should manage data, loading, error, and refetch behavior.
- API interaction belongs inside the hook/service layer, not directly in presentation components.
- Use useCallback/useEffect appropriately to prevent unnecessary requests and rerenders.

IMPORT ORDER:
1. React/Next.js imports
2. Component imports
3. Service imports
4. Type imports
5. Utility imports

ERROR HANDLING:
- Always handle API errors gracefully.
- Display meaningful error states/messages to users.
- Never silently swallow errors.
- Services should normalize/throw meaningful errors.
- Components/hooks should expose and render error state appropriately.

STYLING:
- Use Tailwind CSS utilities.
- Do NOT use inline styles.
- Do NOT use CSS-in-JS.
- Do NOT create unnecessary custom CSS classes.

PERFORMANCE:
- Avoid unnecessary re-renders.
- Memoize components where appropriate.
- Avoid unnecessary state.
- Avoid unnecessary bundles/code.
- Clean up WebSocket/subscription resources.

TESTING:
- Test component rendering.
- Test user interactions.
- Test API calls using mocks.
- Test loading states.
- Test error states.
- Follow the existing component test structure using describe/it and React Testing Library.

CRITICAL THINGS NOT TO CHANGE:
- `services/api.ts` → all backend API calls, API structure, and error handling.
- `services/websocket.ts` → WebSocket connection/reconnection logic.
- `hooks/useWebSocket.ts` → WebSocket event-handling pattern.
- `types/api.ts` → API type structures.
- `app/layout.tsx` → provider/root-layout structure.
- `app/page.tsx` → home-page structure.
- Do not bypass the service architecture.
- Do not introduce direct fetch calls inside components.
- Do not create multiple WebSocket connections.
- Do not break existing API/WebSocket contracts.

BEFORE MAKING ANY CHANGE:
1. Read and understand the agent instructions.
2. Understand the component hierarchy.
3. Verify the change is actually necessary.
4. Consider downstream effects.
5. Follow existing patterns.
6. Keep components focused.
7. Use proper TypeScript types.
8. Route all API calls through services.
9. Handle loading and error states.
10. Use environment variables for URLs.
11. Test rendering, interactions, API behavior, loading, and errors.

CORE PRINCIPLE:
Keep React components focused on presentation and UI interaction, keep business/networking logic in hooks and services, communicate with the backend exclusively through TradingAPI/WebSocketService, maintain strict TypeScript typing, use Tailwind for styling, and preserve the existing component/service/type architecture.