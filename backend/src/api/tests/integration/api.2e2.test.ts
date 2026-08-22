// src/api/tests/integration/api.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

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

interface BalanceResponse {
    userId: string;
    asset: string;
    available: number;
    locked: number;
    total: number;
}

interface HealthResponse {
    status: string;
    timestamp?: string;
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

describe('E2E: API Endpoints', () => {
    const BASE_URL = 'http://localhost:3000';

    // Check if server is running
    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/health`);
            if (!response.ok) {
                console.warn('⚠️ Server might not be running. E2E tests may fail.');
            }
        } catch {
            console.warn('⚠️ Server not reachable. E2E tests will fail.');
        }
    });

    describe('Health Check', () => {
        it('should return 200 OK', async () => {
            const response = await fetch(`${BASE_URL}/api/health`);
            const data = await parseResponse<HealthResponse>(response);

            expect(response.status).toBe(200);
            expect(data.status).toBe('healthy');
        });
    });

    describe('Order API', () => {
        it('should place a limit order', async () => {
            const response = await fetch(`${BASE_URL}/api/orders`, {
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

            const data = await parseResponse<OrderResponse>(response);

            expect(response.status).toBe(201);
            expect(data).toHaveProperty('id');
            expect(data.userId).toBe('alice');
            expect(data.symbol).toBe('BTC/USD');
            expect(data.price).toBe(100);
            expect(data.quantity).toBe(1);
        });

        it('should reject order with invalid data', async () => {
            const response = await fetch(`${BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'alice'
                    // Missing required fields
                })
            });

            // ✅ Your controller returns 400 for validation errors
            expect(response.status).toBe(400);
        });

        it('should cancel an existing order', async () => {
            // 1. Place order first
            const placeResponse = await fetch(`${BASE_URL}/api/orders`, {
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

            expect(placeResponse.status).toBe(201);
            const orderData = await parseResponse<OrderResponse>(placeResponse);

            // 2. Cancel the order
            const cancelResponse = await fetch(`${BASE_URL}/api/orders`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderData.id,
                    userId: 'alice'
                })
            });

            expect(cancelResponse.status).toBe(200);
            const cancelData = await parseResponse<SuccessResponse>(cancelResponse);
            expect(cancelData.message).toBe('Order cancelled successfully');
        });
    });

    describe('Balance API', () => {
        it('should get user balance', async () => {
            const response = await fetch(`${BASE_URL}/api/balance/alice?asset=USD`);
            const data = await parseResponse<BalanceResponse>(response);

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('userId', 'alice');
            expect(data).toHaveProperty('asset', 'USD');
            expect(data).toHaveProperty('available');
            expect(data).toHaveProperty('locked');
            expect(data).toHaveProperty('total');
        });

        it('should handle invalid user', async () => {
            const response = await fetch(`${BASE_URL}/api/balance/unknown?asset=USD`);
            
            // ✅ Returns 404 for non-existent user
            expect(response.status).toBe(404);
        });
    });

    describe('404 Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await fetch(`${BASE_URL}/api/unknown`, {
                method: 'GET'
            });

            expect(response.status).toBe(404);
        });
    });
});