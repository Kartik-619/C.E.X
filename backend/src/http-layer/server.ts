// src/api/server.ts

import { serve } from 'bun';
import { StandardEngine } from '../domain/engine/services/Engine';
import { OrderBook } from '../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../domain/engine/services/wallet/wallet';
import { inmemory_OrderBookStore } from '../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../infra/store/wallet-store';
import { OrderService } from './service/order-service';
import { OrderController } from './controllers/order-controller';
import { Routes } from './routes/index';
import type { AppRouter } from './routes/route.interface';
import { seedDatabase } from '../tests/seed/seed';
import { EventManager } from '../domain/events/event-bus';
// 1. Infrastructure Layer
const orderBookStore = new inmemory_OrderBookStore();
const walletStore = new Inmemory_WalletStore();
const orderBook = new OrderBook(orderBookStore);
const wallet = new Wallet(walletStore);
const bus=new EventManager();
const engine = new StandardEngine(orderBook, wallet,bus);

// 2. Service Layer
const orderService = new OrderService(engine);

// 3. Controller Layer
const orderController = new OrderController(orderService);

// 4. Routes
const routes = new Routes(orderController);

// 5. Create router adapter
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

// 6. Register routes
routes.register(router);

// ✅ 7. Seed the database with test users
await seedDatabase(walletStore);

// 8. Server with manual routing
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
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        try {
            // Health check
            if (path === '/api/health' && method === 'GET') {
                return new Response(
                    JSON.stringify({ status: 'healthy' }),
                    { status: 200, headers }
                );
            }

            // Place order: POST /api/orders
            if (path === '/api/orders' && method === 'POST') {
                return orderController.placeOrder(request);
            }

            // Add order: POST /api/orders/add
            if (path === '/api/orders/add' && method === 'POST') {
                return orderController.addOrder(request);
            }

            // Cancel order: DELETE /api/orders
            if (path === '/api/orders' && method === 'DELETE') {
                return orderController.cancelOrder(request);
            }

            // GET /api/balance/:userId - Get balance
            if (path.startsWith('/api/balance/') && method === 'GET') {
                return orderController.getBalance(request);
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
console.log(`   POST   /api/orders        - Place an order`);
console.log(`   POST   /api/orders/add   - Add order to book`);
console.log(`   DELETE /api/orders        - Cancel an order`);
console.log(`   GET    /api/balance/:userId - Get balance`);
console.log(`   GET    /api/health        - Health check`);