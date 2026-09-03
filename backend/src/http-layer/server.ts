// src/api/server.ts

import { serve } from 'bun';
import { StandardEngine } from '../domain/engine/services/Engine';
import { OrderBook } from '../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../domain/engine/services/wallet/wallet';

// In-memory stores
import { inmemory_OrderBookStore } from '../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../infra/store/wallet-store';
import { Inmemory_User } from '../infra/store/inmemory-user.store';

// Database stores
import { DbOrderBookStore } from '../infra/store/db-orderbook.store';
import { DbWalletStore } from '../infra/store/db-wallet.store';
import { DbUserStore } from '../infra/store/db-user.store';
import { migrate } from '../infra/db/schema';
import { closePool } from '../infra/db/connection';

import { OrderService } from './service/order-service';
import { AuthService } from './service/auth-service';
import { OrderController } from './controllers/order-controller';
import { AuthController } from './controllers/auth-controller';
import { OAuthController } from './controllers/oauth-controller';
import { AuthMiddleware } from './middleware/auth-middleware';
import { Routes } from './routes/index';
import type { AppRouter } from './routes/route.interface';
import { seedDatabase } from '../tests/seed/seed';
import { EventManager } from '../domain/events/event-bus';
import { WebsocketServer } from '../infra/ws/ws-server';
import { WebSocketBroadcaster } from '../domain/events/ws-broadcast.orderbook';
import { LoggerFactory } from '../infra/logging/logger.factory';
import { LogLevel } from '../infra/logging/log-level';

const USE_DB = process.env.USE_DB === 'true';

// 1. Create Logger
const logger = LoggerFactory.createLogger('console', LogLevel.INFO);

// 2. Infrastructure Layer — select store backend
let orderBookStore: inmemory_OrderBookStore | DbOrderBookStore;
let walletStore: Inmemory_WalletStore | DbWalletStore;
let userStore: Inmemory_User | DbUserStore;

if (USE_DB) {
    logger.log(LogLevel.INFO, '[Server] Using PostgreSQL stores');
    await migrate();
    orderBookStore = new DbOrderBookStore();
    walletStore = new DbWalletStore();
    userStore = new DbUserStore();
} else {
    logger.log(LogLevel.INFO, '[Server] Using in-memory stores');
    orderBookStore = new inmemory_OrderBookStore();
    walletStore = new Inmemory_WalletStore();
    userStore = new Inmemory_User();
}

const orderBook = new OrderBook(orderBookStore);
const wallet = new Wallet(walletStore);
const bus = new EventManager();

// 3. Create WebSocket Server
const wsServer = new WebsocketServer(3011, logger);
wsServer.start();

// 4. Create WebSocket Broadcaster (connects EventBus → WebSocket)
const wsBroadcaster = new WebSocketBroadcaster(bus, wsServer);

// 5. Create Engine with EventBus
const engine = new StandardEngine(orderBook, wallet, bus);

// 6. Service Layer
const orderService = new OrderService(engine);
const authService = new AuthService(userStore, walletStore);

// 7. Controller Layer
const orderController = new OrderController(orderService);
const authController = new AuthController(authService);
const oauthController = new OAuthController(authService);

// 8. Middleware
const authMiddleware = new AuthMiddleware(authService);

// 9. Routes
const routes = new Routes(orderController, authController, oauthController);

// 10. Create router adapter
const router: AppRouter = {
    get: (path, handler) => {
        console.log(`GET ${path}`);
    },
    post: (path, handler) => {
        console.log(`POST ${path}`);
    },
    delete: (path, handler) => {
        console.log(`DELETE ${path}`);
    },
};

// 11. Register routes
routes.register(router);

// 12. Seed the database with test users
await seedDatabase(walletStore);

// 13. Protected route handler wrapper
const requireAuth = authMiddleware.createHandler.bind(authMiddleware);

// 14. Server with manual routing
const server = serve({
    port: 3010,
    async fetch(request: Request) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;

        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        const withCorsHeaders = (response: Response): Response => {
            const responseHeaders = new Headers(response.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders,
            });
        };

        try {
            let response: Response;

            if (path === '/api/health' && method === 'GET') {
                response = new Response(
                    JSON.stringify({ status: 'healthy', storage: USE_DB ? 'postgresql' : 'in-memory' }),
                    { status: 200, headers }
                );
            } else if (path === '/api/auth/register' && method === 'POST') {
                response = await authController.register(request);
            } else if (path === '/api/auth/login' && method === 'POST') {
                response = await authController.login(request);
            } else if (path === '/api/auth/oauth' && method === 'GET') {
                response = await oauthController.initiate(request);
            } else if (path === '/api/auth/oauth/callback' && method === 'GET') {
                response = await oauthController.callback(request);
            } else if (path === '/api/auth/oauth/providers' && method === 'GET') {
                response = await oauthController.providers(request);
            } else if (path === '/api/orderbook' && method === 'GET') {
                response = await orderController.getOrderBook(request);
            } else if (path === '/api/orders' && method === 'POST') {
                response = await requireAuth((req) => orderController.placeOrder(req))(request);
            } else if (path === '/api/orders/add' && method === 'POST') {
                response = await requireAuth((req) => orderController.addOrder(req))(request);
            } else if (path === '/api/orders' && method === 'DELETE') {
                response = await requireAuth((req) => orderController.cancelOrder(req))(request);
            } else if (path.startsWith('/api/balance/') && method === 'GET') {
                response = await requireAuth((req) => orderController.getBalance(req))(request);
            } else if (path === '/api/balance/deposit' && method === 'POST') {
                response = await requireAuth((req, auth) => orderController.deposit(req, auth))(request);
            } else {
                response = new Response(
                    JSON.stringify({ error: `Route ${method} ${path} not found` }),
                    { status: 404, headers }
                );
            }

            return withCorsHeaders(response);

        } catch (error: any) {
            return new Response(
                JSON.stringify({
                    error: 'Internal server error',
                    message: error.message
                }),
                { status: 500, headers }
            );
        }
    }
});

console.log(`Server running on http://localhost:${server.port}`);
console.log(`Storage: ${USE_DB ? 'PostgreSQL' : 'In-Memory'}`);
console.log(`Endpoints:`);
console.log(`   POST   /api/auth/register          - Register a new user`);
console.log(`   POST   /api/auth/login             - Login`);
console.log(`   GET    /api/auth/oauth              - Initiate OAuth flow`);
console.log(`   GET    /api/auth/oauth/callback     - OAuth callback`);
console.log(`   GET    /api/auth/oauth/providers    - List configured OAuth providers`);
console.log(`   POST   /api/orders                 - Place an order (auth)`);
console.log(`   POST   /api/orders/add             - Add order to book (auth)`);
console.log(`   DELETE /api/orders                  - Cancel an order (auth)`);
console.log(`   GET    /api/balance/:userId         - Get balance (auth)`);
console.log(`   POST   /api/balance/deposit        - Deposit funds (auth)`);
console.log(`   GET    /api/orderbook               - Get order book`);
console.log(`   GET    /api/health                  - Health check`);
console.log(`WebSocket running on ws://localhost:3011`);

// Graceful shutdown
const shutdown = async () => {
    console.log('\nShutting down...');
    wsServer.stop();
    server.stop();
    if (USE_DB) {
        await closePool();
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
