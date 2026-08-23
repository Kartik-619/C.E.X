// src/api/tests/integration/OrderFlow.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { StandardEngine } from '../../domain/engine/services/Engine';
import { OrderBook } from '../../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../../domain/engine/services/wallet/wallet';
import { inmemory_OrderBookStore } from '../../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../../infra/store/wallet-store';
import { OrderService } from '../../http-layer/service/order-service';
import { OrderController } from '../../http-layer/controllers/order-controller';

// ─── Type Definitions ──────────────────────────────────────────────

interface OrderResponse {
    id: number;
    userId: string;
    symbol: string;
    side: string;
    price: number;
    quantity: number;
    status?: string;
    totalValue: number;
    createdAt: string;
}

interface SuccessResponse {
    message: string;
}

interface ErrorResponse {
    error: string;
}

// ─── Helper ─────────────────────────────────────────────────────────

async function parseResponse<T>(response: Response): Promise<T> {
    const data = await response.json() as T;
    return data;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Order Flow Integration', () => {
    let controller: OrderController;
    let orderBookStore: inmemory_OrderBookStore;
    let walletStore: Inmemory_WalletStore;
    let engine: StandardEngine;

    beforeEach(async () => {
        // Setup real infrastructure
        orderBookStore = new inmemory_OrderBookStore();
        walletStore = new Inmemory_WalletStore();

        const orderBook = new OrderBook(orderBookStore);
        const wallet = new Wallet(walletStore);
        engine = new StandardEngine(orderBook, wallet);

        // Deposit funds
        await walletStore.deposit('alice', 'USD', 1000);
        await walletStore.deposit('bob', 'BTC', 5);

        // Setup service and controller
        const service = new OrderService(engine);
        controller = new OrderController(service);
    });

    describe('Complete Order Flow', () => {
        it('should place and match orders successfully', async () => {
            // 1. Bob places sell order
            const sellRequest = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'bob',
                    symbol: 'BTC/USD',
                    side: 'sell',
                    price: 100,
                    quantity: 1
                })
            });

            const sellResponse = await controller.placeOrder(sellRequest);
            expect(sellResponse.status).toBe(201);

            // 2. Alice places buy order
            const buyRequest = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: 100,
                    quantity: 1
                })
            });

            const buyResponse = await controller.placeOrder(buyRequest);
            const buyData = await parseResponse<OrderResponse>(buyResponse);

            expect(buyResponse.status).toBe(201);
            expect(buyData).toHaveProperty('id');

            // 3. Verify balances
            const aliceBalance = await engine.getBalance('alice', 'USD');
            const bobBalance = await engine.getBalance('bob', 'BTC');

            expect(aliceBalance.available).toBe(900); // 1000 - 100
            expect(bobBalance.available).toBe(4); // 5 - 1
        });

        it('should add order to book when no match found', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: 50, // Low price, no match
                    quantity: 1
                })
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<OrderResponse>(response);

            expect(response.status).toBe(201);
            expect(data).toHaveProperty('id');

            // Verify order is in book
            const orderBook = orderBookStore.getOrderBook();
            expect(orderBook.length).toBe(1);
        });

        it('should cancel an existing order', async () => {
            // 1. Place an order
            const placeRequest = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: 50,
                    quantity: 1
                })
            });

            const placeResponse = await controller.placeOrder(placeRequest);
            const orderData = await parseResponse<OrderResponse>(placeResponse);
            expect(placeResponse.status).toBe(201);

            // 2. Cancel the order
            const cancelRequest = new Request('http://localhost/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderData.id,
                    userId: 'alice'
                })
            });

            const cancelResponse = await controller.cancelOrder(cancelRequest);
            const cancelData = await parseResponse<SuccessResponse>(cancelResponse);

            // ✅ FIX: Expect status 200 (not 201)
            expect(cancelResponse.status).toBe(200);
            expect(cancelData.message).toBe('Order cancelled successfully');

            // 3. Verify order is removed
            const orderBook = orderBookStore.getOrderBook();
            expect(orderBook.length).toBe(0);

            // 4. Verify funds are unlocked
            const aliceBalance = await engine.getBalance('alice', 'USD');
            expect(aliceBalance.available).toBe(1000);
        });

        // In OrderFlow.test.ts

        it('should handle insufficient funds correctly', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: 100,
                    quantity: 100 // Too much
                })
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

    expect(response.status).toBe(500);
            expect(data.error).toBeDefined();
        });
    });

    describe('Multiple Order Matching', () => {
        it('should match multiple orders in priority order', async () => {
            // 1. Place sell orders at different prices
            const sellOrders = [
                { userId: 'bob', price: 100, quantity: 1 },
                { userId: 'bob', price: 99, quantity: 2 },
                { userId: 'bob', price: 101, quantity: 1 }
            ];

            for (const order of sellOrders) {
                const request = new Request('http://localhost/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: order.userId,
                        symbol: 'BTC/USD',
                        side: 'sell',
                        price: order.price,
                        quantity: order.quantity
                    })
                });
                await controller.placeOrder(request);
            }

            // 2. Place buy order at $100 for 3 units
            const buyRequest = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: 100,
                    quantity: 3
                })
            });

            const buyResponse = await controller.placeOrder(buyRequest);
            const buyData = await parseResponse<OrderResponse>(buyResponse);

            expect(buyResponse.status).toBe(201);
            expect(buyData).toHaveProperty('id');

            // The $99 and $100 sell orders should be matched
            // The $101 sell order remains
            const orderBook = orderBookStore.getOrderBook();
            expect(orderBook.length).toBe(1);

            // ✅ FIX: Check that orderBook[0] exists before accessing price
            const remainingOrder = orderBook[0];
            expect(remainingOrder).toBeDefined();
            expect(remainingOrder?.price).toBe(101);
        });
    });
});