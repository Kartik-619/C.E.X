// src/tests/unit/event-bus.test.ts

import { describe, it, expect, mock } from 'bun:test';
import { EventManager } from '../../domain/events/event-bus';
import { EventType } from '../../domain/events/Ibroadcast.orderbook';
import { LogLevel } from '../../infra/logging/log-level';
import type { Logger } from '../../infra/logging/logger';

function createBus() {
    const log = mock((level: LogLevel, message: string) => {});
    const logger = { log } as unknown as Logger;
    const bus = new EventManager(logger);
    return { bus, log };
}

describe('EventManager', () => {
    it('should notify all subscribed listeners with the event data', async () => {
        const { bus } = createBus();
        const listener = { update: mock((data: unknown) => {}) };

        await bus.subscriber(EventType.ORDER_PLACED, listener);
        const payload = { orderId: 1, userId: 'alice' };

        bus.notify(EventType.ORDER_PLACED, payload);

        expect(listener.update).toHaveBeenCalledWith(payload);
    });

    it('should stop notifying a listener after unsubscribing', async () => {
        const { bus } = createBus();
        const listener = { update: mock((data: unknown) => {}) };

        const unsubscribe = await bus.subscriber(EventType.ORDER_CANCELLED, listener);
        await unsubscribe();

        bus.notify(EventType.ORDER_CANCELLED, { orderId: 2 });

        expect(listener.update).not.toHaveBeenCalled();
    });

    it('should not throw when notifying an event without listeners', () => {
        const { bus, log } = createBus();

        bus.notify(EventType.TRADE_EXECUTED, { tradeId: 't-1' });

        expect(log).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('No listeners'));
    });

    it('should track subscriber count per event type', async () => {
        const { bus } = createBus();

        expect(bus.getSubscriberCount(EventType.ORDER_PLACED)).toBe(0);

        await bus.subscriber(EventType.ORDER_PLACED, { update: () => {} });
        await bus.subscriber(EventType.ORDER_PLACED, { update: () => {} });

        expect(bus.getSubscriberCount(EventType.ORDER_PLACED)).toBe(2);
        expect(bus.getSubscriberCount(EventType.ORDER_FILLED)).toBe(0);
    });

    it('should clear all subscribers', async () => {
        const { bus } = createBus();

        await bus.subscriber(EventType.ORDER_PLACED, { update: () => {} });
        await bus.subscriber(EventType.TRADE_EXECUTED, { update: () => {} });

        bus.clearAll();

        expect(bus.getSubscriberCount(EventType.ORDER_PLACED)).toBe(0);
        expect(bus.getSubscriberCount(EventType.TRADE_EXECUTED)).toBe(0);
    });

    it('should log subscribe, notify and unsubscribe activity through the logger service', async () => {
        const { bus, log } = createBus();
        const listener = { update: () => {} };

        await bus.subscriber(EventType.ORDER_PLACED, listener);
        expect(log).toHaveBeenCalledWith(
            LogLevel.INFO,
            expect.stringContaining('Subscribed listener for event: ORDER_PLACED')
        );

        bus.notify(EventType.ORDER_PLACED, { orderId: 1 });
        expect(log).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Notifying 1 listener(s)'));

        await bus.unsubscriber(EventType.ORDER_PLACED, listener);
        expect(log).toHaveBeenCalledWith(
            LogLevel.INFO,
            expect.stringContaining('Unsubscribed listener from event: ORDER_PLACED')
        );
    });
});