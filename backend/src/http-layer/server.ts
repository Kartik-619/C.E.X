// src/api/server.ts

import { serve } from 'bun';
import { StandardEngine } from '../domain/engine/services/Engine';
import { OrderBook } from '../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../domain/engine/services/wallet/wallet';
import { inmemory_OrderBookStore } from '../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../infra/store/wallet-store';
import { Inmemory_User } from '../infra/store/inmemory-user.store';
import { OrderService } from './service/order-service';
import { AuthService } from './service/auth-service';
import { OrderController } from './controllers/order-controller';
import { AuthController } from './controllers/auth-controller';
import { AuthMiddleware } from './middleware/auth-middleware';
import { Routes } from './routes/index';
import type { AppRouter } from './routes/route.interface';
import { seedDatabase } from '../tests/seed/seed';
import { EventManager } from '../domain/events/event-bus';
import { WebsocketServer } from '../infra/ws/ws-server';
import { WebSocketBroadcaster } from '../domain/events/ws-broadcast.orderbook';
import { LoggerFactory } from '../infra/logging/logger.factory';
import { LogLevel } from '../infra/logging/log-level';

// 1. Create Logger
const logger = LoggerFactory.createLogger('console', LogLevel.INFO);

// 2. Infrastructure Layer
const orderBookStore = new inmemory_OrderBookStore();
const walletStore = new Inmemory_WalletStore();
const userStore = new Inmemory_User();
const orderBook = new OrderBook(orderBookStore);
const wallet = new Wallet(walletStore);
const bus = new EventManager();

// 3. Create WebSocket Server
const wsServer = new WebsocketServer(3001, logger);
wsServer.start();

// 4. Create WebSocket Broadcaster (connects EventBus → WebSocket)
const wsBroadcaster = new WebSocketBroadcaster(bus, wsServer);

// 5. Create Engine with EventBus
const engine = new StandardEngine(orderBook, wallet, bus);

// 6. Service Layer
const orderService = new OrderService(engine);
const authService = new AuthService(userStore);

// 7. Controller Layer
const orderController = new OrderController(orderService);
const authController = new AuthController(authService);

// 8. Middleware
const authMiddleware = new AuthMiddleware(authService);

// 9. Routes
const routes = new Routes(orderController, authController);

// 10. Create router adapter
const router: AppRouter = {
    get: (path, handler) => {
        console.log(`📌 GET ${path}`);
    },
    post: (path, handler) => {
        console.log(`📌 POST ${path}`);
    },
    delete: (path, handler) => {
        console.log(`📌 DELETE ${path}`);
    },
};

// 11. Register routes
routes.register(router);

// 12. Seed the database with test users
await seedDatabase(walletStore);

// 13. Protected route handler wrapper
const requireAuth = authMiddleware.createHandler;

// 14. Server with manual routing
const server = serve({
    port: 3000,
    fetch(request: Request) {
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

        try {
            // ── Public Routes ────────────────────────────────────

            // Health check
            if (path === '/api/health' && method === 'GET') {
                return new Response(
                    JSON.stringify({ status: 'healthy' }),
                    { status: 200, headers }
                );
            }

            // Auth: Register
            if (path === '/api/auth/register' && method === 'POST') {
                return authController.register(request);
            }

            // Auth: Login
            if (path === '/api/auth/login' && method === 'POST') {
                return authController.login(request);
            }

            // Orderbook (public read)
            if (path === '/api/orderbook' && method === 'GET') {
                return orderController.getOrderBook(request);
            }

            // ── Protected Routes (require valid JWT) ─────────────

            // Place order: POST /api/orders
            if (path === '/api/orders' && method === 'POST') {
                return requireAuth((req) => orderController.placeOrder(req))(request);
            }

            // Add order: POST /api/orders/add
            if (path === '/api/orders/add' && method === 'POST') {
                return requireAuth((req) => orderController.addOrder(req))(request);
            }

            // Cancel order: DELETE /api/orders
            if (path === '/api/orders' && method === 'DELETE') {
                return requireAuth((req) => orderController.cancelOrder(req))(request);
            }

            // GET /api/balance/:userId - Get balance
            if (path.startsWith('/api/balance/') && method === 'GET') {
                return requireAuth((req) => orderController.getBalance(req))(request);
            }

            // 404 Not Found
            return new Response(
                JSON.stringify({ error: `Route ${method} ${path} not found` }),
                { status: 404, headers }
            );

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

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`📋 Endpoints:`);
console.log(`   POST   /api/auth/register  - Register a new user`);
console.log(`   POST   /api/auth/login     - Login`);
console.log(`   POST   /api/orders         - Place an order (auth)`);
console.log(`   POST   /api/orders/add     - Add order to book (auth)`);
console.log(`   DELETE /api/orders          - Cancel an order (auth)`);
console.log(`   GET    /api/balance/:userId - Get balance (auth)`);
console.log(`   GET    /api/orderbook       - Get order book`);
console.log(`   GET    /api/health          - Health check`);
console.log(`🔌 WebSocket running on ws://localhost:3001`);