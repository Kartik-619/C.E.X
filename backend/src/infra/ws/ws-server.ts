// src/infra/ws/ws-server.ts

import type { ServerWebSocket } from "bun";
import { LogLevel } from "../logging/log-level";
import type { Logger } from "../logging/logger";
import type { ITokenVerifier } from "../auth/jwt";
import { WsClientRegistry, type WsSink } from "./ws-client.registry";

/** Identity carried on every upgraded socket (provided at upgrade time). */
export interface WsConnectionData {
    clientId: string;
    userId: string | null;
}

/** Minimal surface of a Bun server needed to upgrade a request. */
export interface UpgradableServer {
    upgrade(request: Request, options?: { data?: WsConnectionData }): boolean;
}

/**
 * WebSocket layer attached to the shared HTTP server.
 *
 * The class no longer owns its own listener: Bun.serve (single port) delegates
 * HTTP upgrades via handleUpgrade() and socket lifecycle via `handlers`, so
 * HTTP API and WebSocket share one access point/port.
 */
export class WebsocketServer {
    private readonly clientRegistry: WsClientRegistry;

    constructor(
        private readonly logger: Logger,
        private readonly tokenVerifier: ITokenVerifier
    ) {
        this.clientRegistry = new WsClientRegistry(logger);
    }

    /** Bun.serve `websocket` handler bundle (open / message / close). */
    get handlers(): {
        open: (ws: ServerWebSocket<WsConnectionData>) => void;
        message: (ws: ServerWebSocket<WsConnectionData>, message: string | Uint8Array) => void;
        close: (ws: ServerWebSocket<WsConnectionData>) => void;
    } {
        return {
            open: (ws) => {
                const { clientId, userId } = ws.data;
                this.clientRegistry.register(clientId, ws as unknown as WsSink, userId);
                this.logger.log(LogLevel.INFO, `[WebSocket] Client connected: ${clientId}${userId ? ` as ${userId}` : ''} (${this.getClientCount()} total)`);
            },
            message: (ws, message) => {
                // Handle messages from client if needed
                this.logger.log(LogLevel.DEBUG, `[WebSocket] Received message from ${ws.data.clientId}`);
            },
            close: (ws) => {
                this.clientRegistry.unregister(ws.data.clientId);
                this.logger.log(LogLevel.INFO, `[WebSocket] Client disconnected: ${ws.data.clientId} (${this.getClientCount()} remaining)`);
            },
        };
    }

    /** True when the incoming HTTP request is a WebSocket upgrade attempt. */
    isUpgradeRequest(request: Request): boolean {
        return request.headers.get('upgrade')?.toLowerCase() === 'websocket';
    }

    /**
     * Upgrade an HTTP request on the shared server, carrying the authenticated
     * identity so this client is reachable via sendToUser.
     * Returns the 101 response on success, or a 400 response on failure.
     */
    handleUpgrade(request: Request, server: UpgradableServer): Response {
        const url = new URL(request.url);
        const data: WsConnectionData = {
            clientId: crypto.randomUUID(),
            userId: this.resolveUserId(url.searchParams.get('token')),
        };

        if (server.upgrade(request, { data })) {
            return new Response(null, { status: 101 });
        }

        this.logger.log(LogLevel.WARN, '[WebSocket] Failed to upgrade request');
        return new Response(
            JSON.stringify({ error: 'WebSocket upgrade failed' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    broadcast(eventType: string, data: any): void {
        const message = this.serialize(eventType, data);
        const sentCount = this.clientRegistry.broadcast(message);

        if (sentCount > 0) {
            this.logger.log(LogLevel.DEBUG, `[WebSocket] Broadcasted ${eventType} to ${sentCount} clients`);
        }
    }

    sendToUser(userId: string, eventType: string, data: any): void {
        const message = this.serialize(eventType, data);
        const sentCount = this.clientRegistry.sendToUser(userId, message);

        if (sentCount > 0) {
            this.logger.log(LogLevel.DEBUG, `[WebSocket] Sent ${eventType} to ${sentCount} client(s) of user ${userId}`);
        }
    }

    getClientCount(): number {
        return this.clientRegistry.getClientCount();
    }

    stop(): void {
        this.clientRegistry.clear();
        this.logger.log(LogLevel.INFO, '[WebSocket] Disconnected all clients');
    }

    private serialize(eventType: string, data: any): string {
        return JSON.stringify({
            type: eventType,
            data: data,
            timestamp: Date.now()
        });
    }

    private resolveUserId(token: string | null): string | null {
        if (!token) return null;

        try {
            return this.tokenVerifier.verify(token).userId;
        } catch {
            this.logger.log(LogLevel.WARN, `[WebSocket] Rejected connection with invalid token`);
            return null;
        }
    }
}
