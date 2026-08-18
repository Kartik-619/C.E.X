// src/api/server.ts

import { serve } from 'bun';
import { StandardEngine } from '../engine/services/Engine';
import { OrderBook } from '../engine/services/orderBook/orderBook';
import { Wallet } from '../engine/services/wallet/wallet';
import { inmemory_OrderBookStore } from '../store/orderbook-store';
import { Inmemory_WalletStore } from '../store/wallet-store';
import { OrderService } from './service/order-service';
import { OrderController } from './controllers/order-controller';
import { Routes } from './routes/index';

// 1. Infrastructure Layer

const orderBookStore = new inmemory_OrderBookStore();
const walletStore = new Inmemory_WalletStore();
const orderBook = new OrderBook(orderBookStore);
const wallet = new Wallet(walletStore);
const engine = new StandardEngine(orderBook, wallet);

// 2. Service Layer

const orderService = new OrderService(engine);

// 3. Controller Layer

const orderController = new OrderController(orderService);

// 4. Routes

const routes = new Routes(orderController);

// 5. Server

const server = serve({
    port: 3000,
    fetch(request: Request) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;

        // CORS headers (optional but recommended)
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight OPTIONS request
        if (method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // Route mapping (manual routing)
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

            // Cancel order: DELETE /api/orders
            if (path === '/api/orders' && method === 'DELETE') {
                return orderController.cancelOrder(request);
            }

            // 404 Not Found
            return new Response(
                JSON.stringify({ error: `Route ${method} ${path} not found` }),
                { status: 404, headers }
            );

        } catch (error: any) {
            // Global error handler
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
console.log(`   POST   /api/orders  - Place an order`);
console.log(`   DELETE /api/orders  - Cancel an order`);
console.log(`   GET    /api/health  - Health check`);