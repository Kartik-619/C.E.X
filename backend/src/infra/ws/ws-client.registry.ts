// src/infra/ws/ws-client.registry.ts

import { LogLevel } from "../logging/log-level";
import type { Logger } from "../logging/logger";

export interface WsSink {
    readyState: number;
    send(message: string): void;
}

interface RegisteredClient {
    sink: WsSink;
    userId: string | null;
}

export class WsClientRegistry {
    private readonly clients: Map<string, RegisteredClient> = new Map();
    private readonly userClients: Map<string, Set<string>> = new Map();
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    register(clientId: string, sink: WsSink, userId: string | null): void {
        this.clients.set(clientId, { sink, userId });

        if (userId) {
            let ids = this.userClients.get(userId);
            if (!ids) {
                ids = new Set();
                this.userClients.set(userId, ids);
            }
            ids.add(clientId);
        }
    }

    unregister(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        if (client.userId) {
            const ids = this.userClients.get(client.userId);
            if (ids) {
                ids.delete(clientId);
                if (ids.size === 0) {
                    this.userClients.delete(client.userId);
                }
            }
        }

        this.clients.delete(clientId);
    }

    sendToUser(userId: string, message: string): number {
        const ids = this.userClients.get(userId);
        if (!ids || ids.size === 0) {
            this.logger.log(
                LogLevel.DEBUG,
                `[WsClientRegistry] No connected client for user ${userId}; message skipped`
            );
            return 0;
        }

        let sentCount = 0;
        for (const clientId of ids) {
            const client = this.clients.get(clientId);
            if (!client) continue;

            try {
                if (client.sink.readyState === 1) {
                    client.sink.send(message);
                    sentCount++;
                }
            } catch (error) {
                this.logger.log(LogLevel.WARN, `[WsClientRegistry] Failed to send to ${clientId}: ${error}`);
                this.unregister(clientId);
            }
        }

        if (sentCount > 0) {
            this.logger.log(LogLevel.DEBUG, `[WsClientRegistry] Sent message to ${sentCount} client(s) for user ${userId}`);
        }

        return sentCount;
    }

    broadcast(message: string): number {
        let sentCount = 0;

        for (const [clientId, client] of this.clients) {
            try {
                if (client.sink.readyState === 1) {
                    client.sink.send(message);
                    sentCount++;
                }
            } catch (error) {
                this.logger.log(LogLevel.WARN, `[WsClientRegistry] Failed to send to ${clientId}: ${error}`);
                this.unregister(clientId);
            }
        }

        if (sentCount > 0) {
            this.logger.log(LogLevel.DEBUG, `[WsClientRegistry] Broadcasted message to ${sentCount} clients`);
        }

        return sentCount;
    }

    getClientCount(): number {
        return this.clients.size;
    }

    clear(): void {
        this.clients.clear();
        this.userClients.clear();
    }
}