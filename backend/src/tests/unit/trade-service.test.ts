// src/tests/unit/trade-service.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TradeService } from '../../http-layer/service/trade-service';
import type { ITradeStore } from '../../domain/engine/interface/ITradeStore';
import type { ITrade } from '../../domain/engine/interface/ITrade';

function makeTrade(overrides: Partial<ITrade> = {}): ITrade {
    return {
        tradeId: 'trade-1',
        buyOrderId: 1,
        sellOrderId: 2,
        buyerId: 'alice',
        sellerId: 'bob',
        symbol: 'BTC/USD',
        price: 100,
        quantity: 0.5,
        totalValue: 50,
        timestamp: new Date('2026-01-01T00:00:00Z'),
        ...overrides
    };
}

describe('TradeService', () => {
    let mockTradeStore: ITradeStore;
    let tradeService: TradeService;

    beforeEach(() => {
        mockTradeStore = {
            recordTrade: mock(async () => {}),
            recordTick: mock(async () => {}),
            getRecentTrades: mock(async (symbol: string, limit?: number) => []),
            getTradesByUser: mock(async (userId: string, limit?: number) => []),
            getTicks: mock(async (symbol: string, limit?: number) => [])
        } as any;

        tradeService = new TradeService(mockTradeStore);
    });

    describe('getRecentTrades', () => {
        it('should default symbol and limit when not provided', async () => {
            await tradeService.getRecentTrades();

            expect(mockTradeStore.getRecentTrades).toHaveBeenCalledWith('BTC/USD', 30);
        });

        it('should map trades to TradeResponseDTO', async () => {
            (mockTradeStore.getRecentTrades as any).mockImplementation(async () => [makeTrade()]);

            const result = await tradeService.getRecentTrades('BTC/USD');

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                tradeId: 'trade-1',
                symbol: 'BTC/USD',
                price: 100,
                quantity: 0.5,
                totalValue: 50,
                timestamp: '2026-01-01T00:00:00.000Z',
                buyOrderId: 1,
                sellOrderId: 2,
                buyerId: 'alice',
                sellerId: 'bob'
            });
        });

        it('should clamp the limit to the maximum allowed', async () => {
            await tradeService.getRecentTrades('BTC/USD', 5000);

            expect(mockTradeStore.getRecentTrades).toHaveBeenCalledWith('BTC/USD', 200);
        });

        it('should reject an invalid symbol format', async () => {
            await expect(tradeService.getRecentTrades('invalid-symbol'))
                .rejects.toThrow('Invalid symbol format. Expected: BTC/USD');
        });
    });

    describe('getTicks', () => {
        it('should return ticks as TickResponseDTO', async () => {
            (mockTradeStore.getTicks as any).mockImplementation(async () => [
                { tickId: 'tick-1', tradeId: 'trade-1', symbol: 'BTC/USD', price: 100, quantity: 0.5, timestamp: 1767225600000 }
            ]);

            const result = await tradeService.getTicks('BTC/USD', 10);

            expect(result).toEqual([
                { tradeId: 'trade-1', symbol: 'BTC/USD', price: 100, quantity: 0.5, timestamp: 1767225600000 }
            ]);
        });
    });

    describe('getUserTrades', () => {
        it('should return trades for the requested user', async () => {
            (mockTradeStore.getTradesByUser as any).mockImplementation(async () => [makeTrade()]);

            const result = await tradeService.getUserTrades('alice', 5);

            expect(mockTradeStore.getTradesByUser).toHaveBeenCalledWith('alice', 5);
            expect(result).toHaveLength(1);
        });

        it('should throw when userId is missing', async () => {
            await expect(tradeService.getUserTrades('')).rejects.toThrow('User ID is required');
        });
    });
});