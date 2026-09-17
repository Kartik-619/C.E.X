import type { EventListener } from "./event-listner.interface";
import { EventType } from "./Ibroadcast.orderbook";
import { Logger } from "../../infra/logging/logger";
import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";

export class EventManager {
    //eventType is the key and value is the set of listners
    private listeners: Map<EventType, Set<EventListener>>;
    private readonly logger: Logger;

    constructor(logger?: Logger) {
        this.listeners = new Map();
        this.logger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    public async subscriber(eventType: EventType, callback: EventListener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set<EventListener>());
        }

        this.listeners.get(eventType)!.add(callback);
        this.logger.log(
            LogLevel.INFO,
            `[EventBus] Subscribed listener for event: ${eventType} (listeners: ${this.listeners.get(eventType)!.size})`
        );
        return () => this.unsubscriber(eventType, callback);
    }

    public async unsubscriber(eventType: EventType, callback: EventListener) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType)!.delete(callback);
            this.logger.log(
                LogLevel.INFO,
                `[EventBus] Unsubscribed listener from event: ${eventType} (listeners: ${this.listeners.get(eventType)!.size})`
            );
        }
    }

    public notify(eventType: EventType, data: any): void {
        const listeners = this.listeners.get(eventType);

        if (listeners && listeners.size > 0) {
            this.logger.log(
                LogLevel.INFO,
                `[EventBus] Notifying ${listeners.size} listener(s) for event: ${eventType}`
            );
            // FIXED: Properly iterate Set and call update() method
            listeners.forEach((listener) => {
                listener.update(data); // EventListener interface has update(filename:string)
            });
        } else {
            this.logger.log(LogLevel.INFO, `[EventBus] No listeners for event: ${eventType}`);
        }
    }

    public clearAll(): void {
        const eventTypeCount = this.listeners.size;
        this.listeners.clear();
        this.logger.log(LogLevel.INFO, `[EventBus] Cleared all listeners (${eventTypeCount} event type(s))`);
    }

    // Added: Get subscriber count (useful for debugging)
    public getSubscriberCount(eventType: EventType): number {
        return this.listeners.get(eventType)?.size ?? 0;
    }
}