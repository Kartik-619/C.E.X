// src/infra/ws/ws-server.ts

import { LogLevel } from "../logging/log-level";
import type { Logger } from "../logging/logger";

export class WebsocketServer {
    private server: any = null;
    private clients: Map<string, WebSocket> = new Map();

    constructor(
        private port: number = 3011,
        private logger: Logger
    ) {}

    start(): void {
        this.server = Bun.serve({
            port: this.port,
            websocket: {
                open: (ws: any) => {
                    const clientId = crypto.randomUUID();
                    ws.clientId = clientId;
                    this.clients.set(clientId, ws);
                    this.logger.log(LogLevel.INFO, `[WebSocket] Client connected: ${clientId} (${this.clients.size} total)`);
                },
                message: (ws: any, message: any) => {
                    // Handle messages from client if needed
                    this.logger.log(LogLevel.DEBUG, `[WebSocket] Received message from ${ws.clientId}`);
                },
                close: (ws: any) => {
                    this.clients.delete(ws.clientId);
                    this.logger.log(LogLevel.INFO, `[WebSocket] Client disconnected: ${ws.clientId} (${this.clients.size} remaining)`);
                }
            },
            fetch: (req: Request) => {
                // Upgrade HTTP request to WebSocket
                const upgraded = this.server?.upgrade(req);
                if (upgraded) {
                    return new Response(null, { status: 101 });
                }
                return new Response('WebSocket endpoint', { status: 200 });
            }
        });

        this.logger.log(LogLevel.INFO, `[WebSocket] Server started on ws://localhost:${this.port}`);
    }

    broadcast(eventType: string, data: any): void {
        const message = JSON.stringify({
            type: eventType,
            data: data,
            timestamp: Date.now()
        });

        let sentCount = 0;

        for (const [clientId, client] of this.clients) {
            try {
                if (client.readyState === 1) { // OPEN
                    client.send(message);
                    sentCount++;
                }
            } catch (error) {
                this.logger.log(LogLevel.WARN, `[WebSocket] Failed to send to ${clientId}: ${error}`);
                this.clients.delete(clientId);
            }
        }

        if (sentCount > 0) {
            this.logger.log(LogLevel.DEBUG, `[WebSocket] Broadcasted ${eventType} to ${sentCount} clients`);
        }
    }

    sendToUser(userId: string, eventType: string, data: any): void {
        this.broadcast(eventType, data);
    }

    getClientCount(): number {
        return this.clients.size;
    }

    stop(): void {
        if (this.server) {
            this.server.stop();
            this.clients.clear();
            this.logger.log(LogLevel.INFO, '[WebSocket] Server stopped');
        }
    }
}