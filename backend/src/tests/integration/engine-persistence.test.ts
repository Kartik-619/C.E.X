// src/tests/integration/engine-persistence.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { StandardEngine } from '../../domain/engine/services/Engine';
import { OrderBook } from '../../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../../domain/engine/services/wallet/wallet';
import { inmemory_OrderBookStore } from '../../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../../infra/store/wallet-store';
import { Inmemory_TradeStore } from '../../infra/store/trade-store';
import { EventManager } from '../../domain/events/event-bus';

describe('Engine trade persistence', () => {
    let engine: StandardEngine;
    let tradeStore: Inmemory_TradeStore;

    beforeEach(async () => {
        const orderBookStore = new inmemory_OrderBookStore();
        const walletStore = new Inmemory_WalletStore();
        tradeStore = new Inmemory_TradeStore();

        await walletStore.deposit('alice', 'USD', 1000);
        await walletStore.deposit('bob', 'BTC', 5);

        const orderBook = new OrderBook(orderBookStore);
        const wallet = new Wallet(walletStore);
        const bus = new EventManager();

        engine = new StandardEngine(orderBook, wallet, bus, tradeStore);
    });

    it('should record a trade and a tick for a matched order', async () => {
        await engine.processOrder({
            orderId: 1,
            userId: 'bob',
            side: 'sell',
            price: 100,
            quantity: 1,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 1
        });

        await engine.processOrder({
            orderId: 2,
            userId: 'alice',
            side: 'buy',
            price: 100,
            quantity: 1,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 100
        });

        const trades = await tradeStore.getRecentTrades('BTC/USD');
        const ticks = await tradeStore.getTicks('BTC/USD');

        expect(trades).toHaveLength(1);
        expect(ticks).toHaveLength(1);

        const trade = trades[0];
        expect(trade).toBeDefined();
        expect(trade).toMatchObject({
            buyerId: 'alice',
            sellerId: 'bob',
            symbol: 'BTC/USD',
            price: 100,
            quantity: 1,
            totalValue: 100
        });

        const tick = ticks[0];
        expect(tick).toBeDefined();
        // The tick must reference the persisted trade (shared tradeId)
        expect(tick?.tradeId).toBe(trade?.tradeId);
        expect(tick?.price).toBe(100);
        expect(tick?.symbol).toBe('BTC/USD');
    });

    it('should record a trade and tick per partial fill', async () => {
        await engine.processOrder({
            orderId: 1,
            userId: 'bob',
            side: 'sell',
            price: 100,
            quantity: 2,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 2
        });

        // Alice's order only has 100 USD available, so it fills 1 unit and the
        // solver must record exactly one fill for the matched quantity.
        await engine.processOrder({
            orderId: 2,
            userId: 'alice',
            side: 'buy',
            price: 100,
            quantity: 1,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 100
        });

        const trades = await tradeStore.getRecentTrades('BTC/USD');

        expect(trades).toHaveLength(1);
        expect(trades[0]?.quantity).toBe(1);
    });

    it('should expose identical tradeId to the domain event and the store', async () => {
        const bus = new EventManager();
        let emittedTradeId: string | null = null;

        const orderBookStore = new inmemory_OrderBookStore();
        const walletStore = new Inmemory_WalletStore();
        await walletStore.deposit('alice', 'USD', 1000);
        await walletStore.deposit('bob', 'BTC', 5);

        const localEngine = new StandardEngine(
            new OrderBook(orderBookStore),
            new Wallet(walletStore),
            bus,
            tradeStore
        );

        bus.subscriber('TRADE_EXECUTED' as any, {
            update: (data: any) => { emittedTradeId = data.tradeId; }
        });

        await localEngine.processOrder({
            orderId: 1,
            userId: 'bob',
            side: 'sell',
            price: 100,
            quantity: 1,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 1
        });

        await localEngine.processOrder({
            orderId: 2,
            userId: 'alice',
            side: 'buy',
            price: 100,
            quantity: 1,
            type: 'LIMIT',
            createdAt: Date.now(),
            symbol: 'BTC/USD',
            lockedAmount: 100
        });

        const trades = await tradeStore.getRecentTrades('BTC/USD');

        expect(trades).toHaveLength(1);
        const persistedTradeId = trades[0]?.tradeId;
        expect(persistedTradeId).toBeDefined();
        expect(emittedTradeId === persistedTradeId).toBe(true);
    });
});