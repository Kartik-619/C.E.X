// src/tests/unit/ws-server.test.ts

import { describe, it, expect, mock } from 'bun:test';
import type { ServerWebSocket } from 'bun';
import { WebsocketServer, type WsConnectionData, type UpgradableServer } from '../../infra/ws/ws-server';
import { LogLevel } from '../../infra/logging/log-level';
import type { Logger } from '../../infra/logging/logger';
import type { ITokenVerifier } from '../../infra/auth/jwt';

function createWsServer() {
    const log = mock((level: LogLevel, message: string) => {});
    const logger = { log } as unknown as Logger;
    const tokenVerifier = {
        verify: mock((token: string) => {
            if (token === 'valid-token') return { userId: 'alice', email: 'alice@test.com' };
            throw new Error('Invalid or expired token');
        })
    } as unknown as ITokenVerifier;

    return { wsServer: new WebsocketServer(logger, tokenVerifier), log };
}

function createUpgradableServer(shouldUpgrade: boolean = true) {
    const captured: { data?: WsConnectionData }[] = [];
    const upgrade = mock((request: Request, options?: { data?: WsConnectionData }) => {
        captured.push(options ?? {});
        return shouldUpgrade;
    });
    const server = { upgrade } as unknown as UpgradableServer;
    return { server, upgrade, captured };
}

function createSocket(data: WsConnectionData) {
    const send = mock((message: string) => {});
    const ws = { data, readyState: 1, send } as unknown as ServerWebSocket<WsConnectionData>;
    return { ws, send };
}

describe('WebsocketServer', () => {
    it('should detect WebSocket upgrade requests regardless of header casing', () => {
        const { wsServer } = createWsServer();

        const upgradeRequest = new Request('http://localhost:3010/', {
            headers: { Upgrade: 'WebSocket' }
        });
        const httpRequest = new Request('http://localhost:3010/api/health');

        expect(wsServer.isUpgradeRequest(upgradeRequest)).toBe(true);
        expect(wsServer.isUpgradeRequest(httpRequest)).toBe(false);
    });

    it('should upgrade on the shared server with the authenticated userId', () => {
        const { wsServer } = createWsServer();
        const { server, upgrade, captured } = createUpgradableServer();

        const response = wsServer.handleUpgrade(
            new Request('http://localhost:3010/?token=valid-token'),
            server
        );

        expect(response.status).toBe(101);
        expect(upgrade).toHaveBeenCalledTimes(1);
        expect(captured[0]!.data?.userId).toBe('alice');
        expect(captured[0]!.data?.clientId).toBeString();
    });

    it('should upgrade anonymously when the token is missing or invalid', () => {
        const { wsServer, log } = createWsServer();
        const { server, captured } = createUpgradableServer();

        wsServer.handleUpgrade(new Request('http://localhost:3010/'), server);
        wsServer.handleUpgrade(new Request('http://localhost:3010/?token=bad-token'), server);

        expect(captured[0]!.data?.userId).toBeNull();
        expect(captured[1]!.data?.userId).toBeNull();
        expect(log).toHaveBeenCalledWith(LogLevel.WARN, expect.stringContaining('invalid token'));
    });

    it('should return 400 when the shared server refuses the upgrade', () => {
        const { wsServer } = createWsServer();
        const { server } = createUpgradableServer(false);

        const response = wsServer.handleUpgrade(
            new Request('http://localhost:3010/?token=valid-token'),
            server
        );

        expect(response.status).toBe(400);
    });

    it('should register connected sockets and deliver private events only to that user', () => {
        const { wsServer } = createWsServer();
        const alice = createSocket({ clientId: 'alice-1', userId: 'alice' });
        const bob = createSocket({ clientId: 'bob-1', userId: 'bob' });

        wsServer.handlers.open(alice.ws);
        wsServer.handlers.open(bob.ws);
        expect(wsServer.getClientCount()).toBe(2);

        wsServer.sendToUser('alice', 'ORDER_FILLED', { orderId: '1' });

        expect(alice.send).toHaveBeenCalledTimes(1);
        expect(bob.send).toHaveBeenCalledTimes(0);

        const sent = JSON.parse(alice.send.mock.calls[0]![0]);
        expect(sent.type).toBe('ORDER_FILLED');
        expect(sent.data).toEqual({ orderId: '1' });
        expect(sent.timestamp).toBeNumber();
    });

    it('should broadcast public events to every connected socket', () => {
        const { wsServer } = createWsServer();
        const alice = createSocket({ clientId: 'alice-1', userId: 'alice' });
        const anonymous = createSocket({ clientId: 'anon-1', userId: null });

        wsServer.handlers.open(alice.ws);
        wsServer.handlers.open(anonymous.ws);

        wsServer.broadcast('TRADE_EXECUTED', { price: 100 });

        expect(alice.send).toHaveBeenCalledTimes(1);
        expect(anonymous.send).toHaveBeenCalledTimes(1);
    });

    it('should unregister sockets on close so they no longer receive events', () => {
        const { wsServer } = createWsServer();
        const alice = createSocket({ clientId: 'alice-1', userId: 'alice' });

        wsServer.handlers.open(alice.ws);
        wsServer.handlers.close(alice.ws);

        expect(wsServer.getClientCount()).toBe(0);

        wsServer.sendToUser('alice', 'ORDER_FILLED', {});
        wsServer.broadcast('TRADE_EXECUTED', {});

        expect(alice.send).toHaveBeenCalledTimes(0);
    });

    it('should clear all clients on stop', () => {
        const { wsServer } = createWsServer();
        const alice = createSocket({ clientId: 'alice-1', userId: 'alice' });

        wsServer.handlers.open(alice.ws);
        wsServer.stop();

        expect(wsServer.getClientCount()).toBe(0);
    });
});

