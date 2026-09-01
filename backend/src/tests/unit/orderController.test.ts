// src/api/tests/unit/OrderController.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { OrderController } from '../../http-layer/controllers/order-controller';
import type { OrderService } from '../../http-layer/service/order-service';
import type { CreateOrderRequestDTO } from '../../http-layer/dto/requestorderDTO';

// ─── Type Definitions ──────────────────────────────────────────────

interface OrderResponse {
    id: number;
    userId: string;
    symbol: string;
    side: string;
    price: number;
    quantity: number;
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

describe('OrderController', () => {
    let mockOrderService: OrderService;
    let controller: OrderController;

    beforeEach(() => {
        mockOrderService = {
            placeOrder: mock(async (dto: CreateOrderRequestDTO) => ({
                id: 123,
                userId: dto.userId,
                symbol: dto.symbol,
                side: dto.side,
                price: dto.price,
                quantity: dto.quantity,
                totalValue: dto.price * dto.quantity,
                createdAt: new Date().toISOString()
            })),
            addOrder: mock(async (dto: CreateOrderRequestDTO) => ({
                id: 456,
                userId: dto.userId,
                symbol: dto.symbol,
                side: dto.side,
                price: dto.price,
                quantity: dto.quantity,
                totalValue: dto.price * dto.quantity,
                createdAt: new Date().toISOString()
            })),
            cancelOrder: mock(async (orderId: number, userId: string) => {}),
            getBalance: mock(async (userId: string, asset: string) => ({
                userId,
                asset,
                available: 1000,
                locked: 0,
                total: 1000
            })),
            hasWallet: mock(async (userId: string) => true),
            getOrderBook: mock(async () => ({
                bids: [{ price: 100, quantity: 2 }],
                asks: [{ price: 101, quantity: 1 }],
                reducedTotalBidQuantity: 2,
                reducedTotalAskQuantity: 1,
                timestamp: new Date().toISOString()
            }))
        } as any;

        controller = new OrderController(mockOrderService);
    });

    describe('placeOrder', () => {
        it('should return 201 with order data on success', async () => {
            const request = new Request('http://localhost/api/orders', {
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

            const response = await controller.placeOrder(request);
            const data = await parseResponse<OrderResponse>(response);

            expect(response.status).toBe(201);
            expect(data).toHaveProperty('id', 123);
            expect(data.userId).toBe('alice');
            expect(data.symbol).toBe('BTC/USD');
            expect(mockOrderService.placeOrder).toHaveBeenCalled();
        });

        // ✅ FIX: Change 500 → 400
        it('should return 400 when required fields are missing', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice'
                    // Missing symbol, side, price, quantity
                })
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(400); // ← Changed from 500
            expect(data).toHaveProperty('error');
        });

        it('should return 400 when price is invalid', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice',
                    symbol: 'BTC/USD',
                    side: 'buy',
                    price: -100,
                    quantity: 1
                })
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(400); // ← Changed from 500
            expect(data.error).toContain('Price must be greater than 0');
        });

        it('should handle invalid JSON gracefully', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json'
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(500);
            expect(data).toHaveProperty('error');
        });
    });

    describe('addOrder', () => {
        it('should return 201 on successful order addition', async () => {
            const request = new Request('http://localhost/api/orders/add', {
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

            const response = await controller.addOrder(request);
            const data = await parseResponse<SuccessResponse>(response);

            expect(response.status).toBe(201);
            expect(data.message).toBe('Order added successfully');
            expect(mockOrderService.addOrder).toHaveBeenCalled();
        });
    });

    describe('cancelOrder', () => {
        it('should return 200 on successful cancellation', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: 123,
                    userId: 'alice'
                })
            });

            const response = await controller.cancelOrder(request);
            const data = await parseResponse<SuccessResponse>(response);

            expect(response.status).toBe(200);
            expect(data.message).toBe('Order cancelled successfully');
            expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(123, 'alice');
        });

        // ✅ FIX: Change 500 → 400 and fix error message
        it('should return 400 when userId is missing', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: 123
                    // Missing userId
                })
            });

            const response = await controller.cancelOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(400); // ← Changed from 500
            // The error might be "Internal server error" if the errorResponse doesn't pass the message
            // Or it could be the actual error message
            expect(data.error).toContain('User ID is required');
        });

        // ✅ FIX: Change 500 → 400 and fix error message
        it('should return 400 when orderId is missing', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice'
                    // Missing orderId
                })
            });

            const response = await controller.cancelOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(400); // ← Changed from 500
            expect(data.error).toContain('Order ID is required');
        });
    });

    describe('getBalance', () => {
        it('should return 200 with balance data', async () => {
            const request = new Request('http://localhost/api/balance/alice?asset=USD', {
                method: 'GET'
            });

            const response = await controller.getBalance(request);
            const data = await parseResponse<{ userId: string; asset: string; available: number; locked: number; total: number }>(response);

            expect(response.status).toBe(200);
            expect(data.userId).toBe('alice');
            expect(data.asset).toBe('USD');
            expect(data.available).toBe(1000);
            expect(data.total).toBe(1000);
            expect(mockOrderService.getBalance).toHaveBeenCalledWith('alice', 'USD');
        });

        // ✅ FIX: Change 500 → 400
        it('should return 400 when userId is missing', async () => {
            const request = new Request('http://localhost/api/balance/', {
                method: 'GET'
            });

            const response = await controller.getBalance(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.status).toBe(400); // ← Changed from 500
            expect(data.error).toContain('User ID is required');
        });
    });

    describe('getOrderBook', () => {
        it('should return 200 with order book snapshot', async () => {
            const request = new Request('http://localhost/api/orderbook', {
                method: 'GET'
            });

            const response = await controller.getOrderBook(request);
            const data = await parseResponse<{
                bids: { price: number; quantity: number }[];
                asks: { price: number; quantity: number }[];
                timestamp: string;
            }>(response);

            expect(response.status).toBe(200);
            expect(data.bids).toHaveLength(1);
            expect(data.asks).toHaveLength(1);
            expect(mockOrderService.getOrderBook).toHaveBeenCalled();
        });
    });

    describe('successResponse', () => {
        it('should format success response correctly', async () => {
            const request = new Request('http://localhost/api/orders', {
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

            const response = await controller.placeOrder(request);
            
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.status).toBe(201);
        });
    });

    describe('errorResponse', () => {
        it('should format error response with correct status', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice'
                    // Missing required fields
                })
            });

            const response = await controller.placeOrder(request);
            const data = await parseResponse<ErrorResponse>(response);

            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(data).toHaveProperty('error');
        });
    });
});