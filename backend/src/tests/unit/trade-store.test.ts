// src/tests/unit/trade-store.test.ts

import { describe, it, expect } from 'bun:test';
import { Inmemory_TradeStore } from '../../infra/store/trade-store';
import type { ITrade } from '../../domain/engine/interface/ITrade';
import type { ITick } from '../../domain/engine/interface/ITradeStore';

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

function makeTick(overrides: Partial<ITick> = {}): ITick {
    return {
        tickId: 'tick-1',
        tradeId: 'trade-1',
        symbol: 'BTC/USD',
        price: 100,
        quantity: 0.5,
        timestamp: 1767225600000,
        ...overrides
    };
}

describe('Inmemory_TradeStore', () => {
    it('should record and return recent trades ordered newest first', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTrade(makeTrade({ tradeId: 'a', timestamp: new Date('2026-01-03T00:00:00Z') }));
        await store.recordTrade(makeTrade({ tradeId: 'b', timestamp: new Date('2026-01-01T00:00:00Z') }));
        await store.recordTrade(makeTrade({ tradeId: 'c', timestamp: new Date('2026-01-02T00:00:00Z') }));

        const trades = await store.getRecentTrades('BTC/USD', 10);

        expect(trades.map((t) => t.tradeId)).toEqual(['a', 'c', 'b']);
    });

    it('should filter recent trades by symbol', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTrade(makeTrade({ tradeId: 'btc', symbol: 'BTC/USD' }));
        await store.recordTrade(makeTrade({ tradeId: 'eth', symbol: 'ETH/USD' }));

        const trades = await store.getRecentTrades('BTC/USD');

        expect(trades).toHaveLength(1);
        expect(trades[0]?.tradeId).toBe('btc');
    });

    it('should respect the limit when returning trades', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTrade(makeTrade({ tradeId: 'a' }));
        await store.recordTrade(makeTrade({ tradeId: 'b' }));

        const trades = await store.getRecentTrades('BTC/USD', 1);

        expect(trades).toHaveLength(1);
    });

    it('should not duplicate trades with the same id', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTrade(makeTrade({ tradeId: 'a' }));
        await store.recordTrade(makeTrade({ tradeId: 'a' }));

        const trades = await store.getRecentTrades('BTC/USD');

        expect(trades).toHaveLength(1);
    });

    it('should return trades involving a user as buyer or seller', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTrade(makeTrade({ tradeId: 'a', buyerId: 'alice', sellerId: 'bob', timestamp: new Date('2026-01-01T00:00:00Z') }));
        await store.recordTrade(makeTrade({ tradeId: 'b', buyerId: 'carol', sellerId: 'alice', timestamp: new Date('2026-01-03T00:00:00Z') }));
        await store.recordTrade(makeTrade({ tradeId: 'c', buyerId: 'carol', sellerId: 'dan', timestamp: new Date('2026-01-02T00:00:00Z') }));

        const aliceTrades = await store.getTradesByUser('alice');

        expect(aliceTrades.map((t) => t.tradeId)).toEqual(['b', 'a']);
    });

    it('should record and return ticks ordered newest first', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTick(makeTick({ tickId: 't1', timestamp: 100 }));
        await store.recordTick(makeTick({ tickId: 't2', timestamp: 300 }));
        await store.recordTick(makeTick({ tickId: 't3', timestamp: 200 }));

        const ticks = await store.getTicks('BTC/USD');

        expect(ticks.map((t) => t.tickId)).toEqual(['t2', 't3', 't1']);
    });

    it('should not duplicate ticks with the same id', async () => {
        const store = new Inmemory_TradeStore();
        await store.recordTick(makeTick({ tickId: 't1' }));
        await store.recordTick(makeTick({ tickId: 't1' }));

        const ticks = await store.getTicks('BTC/USD');

        expect(ticks).toHaveLength(1);
    });
});