// src/tests/unit/ws-client.registry.test.ts

import { describe, it, expect, mock } from 'bun:test';
import { WsClientRegistry, type WsSink } from '../../infra/ws/ws-client.registry';
import { LogLevel } from '../../infra/logging/log-level';
import type { Logger } from '../../infra/logging/logger';

function createRegistry() {
    const log = mock((level: LogLevel, message: string) => {});
    const logger = { log } as unknown as Logger;
    const registry = new WsClientRegistry(logger);
    return { registry, log };
}

function createSink() {
    const sent: string[] = [];
    const sink = {
        readyState: 1,
        send: (message: string) => {
            sent.push(message);
        }
    } as WsSink;
    return { sink, sent };
}

describe('WsClientRegistry', () => {
    it('should deliver a message only to clients of the target user', () => {
        const { registry } = createRegistry();
        const alice = createSink();
        const bob = createSink();
        const anonymous = createSink();

        registry.register('alice-1', alice.sink, 'alice');
        registry.register('bob-1', bob.sink, 'bob');
        registry.register('anon-1', anonymous.sink, null);

        const sentCount = registry.sendToUser('alice', '{"type":"ORDER_FILLED"}');

        expect(sentCount).toBe(1);
        expect(alice.sent).toHaveLength(1);
        expect(bob.sent).toHaveLength(0);
        expect(anonymous.sent).toHaveLength(0);
    });

    it('should deliver to every connected client when the user has multiple connections', () => {
        const { registry } = createRegistry();
        const first = createSink();
        const second = createSink();

        registry.register('alice-1', first.sink, 'alice');
        registry.register('alice-2', second.sink, 'alice');

        const sentCount = registry.sendToUser('alice', 'message');

        expect(sentCount).toBe(2);
        expect(first.sent).toHaveLength(1);
        expect(second.sent).toHaveLength(1);
    });

    it('should send nothing when the user has no connected clients', () => {
        const { registry } = createRegistry();

        const sentCount = registry.sendToUser('ghost', 'message');

        expect(sentCount).toBe(0);
    });

    it('should send nothing to clients that are not in OPEN state', () => {
        const { registry } = createRegistry();
        const closing = createSink();
        closing.sink.readyState = 3;
        const open = createSink();

        registry.register('alice-1', closing.sink, 'alice');
        registry.register('alice-2', open.sink, 'alice');

        const sentCount = registry.sendToUser('alice', 'message');

        expect(sentCount).toBe(1);
        expect(closing.sent).toHaveLength(0);
        expect(open.sent).toHaveLength(1);
    });

    it('should stop delivering to a user after all their clients disconnect', () => {
        const { registry } = createRegistry();
        const sink = createSink();

        registry.register('alice-1', sink.sink, 'alice');
        registry.unregister('alice-1');

        const sentCount = registry.sendToUser('alice', 'message');

        expect(sentCount).toBe(0);
        expect(sink.sent).toHaveLength(0);
    });

    it('should broadcast to every open client regardless of identity', () => {
        const { registry } = createRegistry();
        const alice = createSink();
        const bob = createSink();
        const anonymous = createSink();

        registry.register('alice-1', alice.sink, 'alice');
        registry.register('bob-1', bob.sink, 'bob');
        registry.register('anon-1', anonymous.sink, null);

        const sentCount = registry.broadcast('{"type":"TRADE_EXECUTED"}');

        expect(sentCount).toBe(3);
        expect(alice.sent).toHaveLength(1);
        expect(bob.sent).toHaveLength(1);
        expect(anonymous.sent).toHaveLength(1);
    });

    it('should track total connected clients', () => {
        const { registry } = createRegistry();
        const sink = createSink();

        registry.register('alice-1', sink.sink, 'alice');
        registry.register('bob-1', sink.sink, 'bob');

        expect(registry.getClientCount()).toBe(2);

        registry.unregister('alice-1');

        expect(registry.getClientCount()).toBe(1);
    });

    it('should clear all clients and user mappings', () => {
        const { registry } = createRegistry();
        const sink = createSink();

        registry.register('alice-1', sink.sink, 'alice');
        registry.clear();

        expect(registry.getClientCount()).toBe(0);
        expect(registry.sendToUser('alice', 'message')).toBe(0);
    });
});