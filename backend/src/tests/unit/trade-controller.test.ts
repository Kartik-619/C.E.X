// src/tests/unit/trade-controller.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TradeController } from '../../http-layer/controllers/trade-controller';
import type { TradeService } from '../../http-layer/service/trade-service';

describe('TradeController', () => {
    let mockTradeService: TradeService;
    let controller: TradeController;

    beforeEach(() => {
        mockTradeService = {
            getRecentTrades: mock(async () => []),
            getTicks: mock(async () => []),
            getUserTrades: mock(async () => [])
        } as any;

        controller = new TradeController(mockTradeService);
    });

    describe('getRecentTrades', () => {
        it('should return recent trades with default params', async () => {
            const request = new Request('http://localhost/api/trades', { method: 'GET' });

            const response = await controller.getRecentTrades(request);

            expect(response.status).toBe(200);
            expect(mockTradeService.getRecentTrades).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should pass symbol and limit query params', async () => {
            const request = new Request('http://localhost/api/trades?symbol=ETH/USD&limit=5', { method: 'GET' });

            await controller.getRecentTrades(request);

            expect(mockTradeService.getRecentTrades).toHaveBeenCalledWith('ETH/USD', 5);
        });

        it('should return 500 when the service throws', async () => {
            (mockTradeService.getRecentTrades as any).mockImplementation(async () => {
                throw new Error('boom');
            });

            const request = new Request('http://localhost/api/trades', { method: 'GET' });
            const response = await controller.getRecentTrades(request);
            const data = (await response.json()) as { error?: string };

            expect(response.status).toBe(500);
            expect(data.error).toBe('boom');
        });
    });

    describe('getTicks', () => {
        it('should return ticks from the service', async () => {
            (mockTradeService.getTicks as any).mockImplementation(async () => [
                { tradeId: 'trade-1', symbol: 'BTC/USD', price: 100, quantity: 0.5, timestamp: 1 }
            ]);

            const request = new Request('http://localhost/api/ticks', { method: 'GET' });
            const response = await controller.getTicks(request);
            const data = (await response.json()) as Array<Record<string, unknown>>;

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('getUserTrades', () => {
        it('should return trades for the authenticated user', async () => {
            const auth = { user: { id: 'alice', email: 'alice@test.com', username: 'alice', provider: 'local', providerUserId: null, createdAt: new Date(), updatedAt: new Date() } };
            const request = new Request('http://localhost/api/trades/me', { method: 'GET' });

            const response = await controller.getUserTrades(request, auth);

            expect(response.status).toBe(200);
            expect(mockTradeService.getUserTrades).toHaveBeenCalledWith('alice', undefined);
        });

        it('should return 400 when not authenticated', async () => {
            const request = new Request('http://localhost/api/trades/me', { method: 'GET' });

            const response = await controller.getUserTrades(request);

            expect(response.status).toBe(400);
        });
    });
});