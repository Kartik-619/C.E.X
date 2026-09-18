// src/infra/ws/ws-server.ts

import { LogLevel } from "../logging/log-level";
import type { Logger } from "../logging/logger";
import type { ITokenVerifier } from "../auth/jwt";
import { WsClientRegistry, type WsSink } from "./ws-client.registry";

export class WebsocketServer {
    private server: any = null;
    private readonly clientRegistry: WsClientRegistry;

    constructor(
        private port: number = 3011,
        private logger: Logger,
        private tokenVerifier: ITokenVerifier
    ) {
        this.clientRegistry = new WsClientRegistry(logger);
    }

    start(): void {
        this.server = Bun.serve({
            port: this.port,
            websocket: {
                open: (ws: any) => {
                    const clientId = crypto.randomUUID();
                    ws.clientId = clientId;
                    const userId = ws.data?.userId ?? null;
                    this.clientRegistry.register(clientId, ws as WsSink, userId);
                    this.logger.log(LogLevel.INFO, `[WebSocket] Client connected: ${clientId}${userId ? ` as ${userId}` : ''} (${this.getClientCount()} total)`);
                },
                message: (ws: any, message: any) => {
                    // Handle messages from client if needed
                    this.logger.log(LogLevel.DEBUG, `[WebSocket] Received message from ${ws.clientId}`);
                },
                close: (ws: any) => {
                    this.clientRegistry.unregister(ws.clientId);
                    this.logger.log(LogLevel.INFO, `[WebSocket] Client disconnected: ${ws.clientId} (${this.getClientCount()} remaining)`);
                }
            },
            fetch: (req: Request) => {
                const url = new URL(req.url);
                const userId = this.resolveUserId(url.searchParams.get('token'));

                // Upgrade HTTP request to WebSocket, carrying the authenticated
                // identity so this client is reachable via sendToUser.
                const upgraded = this.server?.upgrade(req, { data: { userId } });
                if (upgraded) {
                    return new Response(null, { status: 101 });
                }
                return new Response('WebSocket endpoint', { status: 200 });
            }
        });

        this.logger.log(LogLevel.INFO, `[WebSocket] Server started on ws://localhost:${this.port}`);
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
        if (this.server) {
            this.server.stop();
            this.clientRegistry.clear();
            this.logger.log(LogLevel.INFO, '[WebSocket] Server stopped');
        }
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