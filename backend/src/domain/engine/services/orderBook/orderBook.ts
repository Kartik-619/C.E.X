import type { Order, IOrderBook } from "../../interface/IOrderBook";
import { Logger } from "../../../../infra/logging/logger";
import { LogLevel } from "../../../../infra/logging/log-level";

export class OrderBook implements IOrderBook {
    private store: IOrderBook;
    private readonly logger?: Logger;

    constructor(store: IOrderBook, logger?: Logger) {
        this.store = store;
        this.logger = logger;
    }

    async placeOrder(order: Order): Promise<Order> {
        if (order.price <= 0) {
            throw new Error("Invalid price");
        }

        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Processing order placement...");
        return await this.store.placeOrder(order);
    }

    async cancelOrder(orderId: number): Promise<void> {
        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Processing order cancellation...");
        await this.store.cancelOrder(orderId);
    }

    async updateOrder(orderId: number, quantity: number): Promise<Order> {
        const order = await this.store.getOrder(orderId);
        if (!order) {
            throw new Error(" Not found")
        }
        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Processing order update...");
        return await this.store.updateOrder(orderId, quantity);
    }

    async getOrder(orderId: number): Promise<Order | null> {
        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Getting order...");
        return await this.store.getOrder(orderId);
    }

    async getBestBid(): Promise<Order | null> {
        return await this.store.getBestBid();
    }

    async getBestAsk(): Promise<Order | null> {
        return await this.store.getBestAsk();
    }

    async getOrderBook(): Promise<Order[]> {
        return await this.store.getOrderBook();
    }

    async findBestMatch(order: Order): Promise<Order | null> {
        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Finding best match...");
        return await this.store.findBestMatch(order);
    }

    getOrdersBySide(side: 'buy' | 'sell'): Order[] {
        if ('getOrdersBySide' in this.store && typeof (this.store as any).getOrdersBySide === 'function') {
            return (this.store as any).getOrdersBySide(side);
        }
        return [];
    }

    getOrderCount(): number {
        if ('getOrderCount' in this.store && typeof (this.store as any).getOrderCount === 'function') {
            return (this.store as any).getOrderCount();
        }
        return 0;
    }

    clearAllOrders(): void {
        if ('clearAllOrders' in this.store && typeof (this.store as any).clearAllOrders === 'function') {
            (this.store as any).clearAllOrders();
        }
    }

    async getBestPrice(side: 'buy' | 'sell'): Promise<number | null> {
        if ('getBestPrice' in this.store && typeof (this.store as any).getBestPrice === 'function') {
            return await (this.store as any).getBestPrice(side);
        }
        return null;
    }

    async atomicMatch(order: Order, quantity: number): Promise<Order | null> {
        this.logger?.log(LogLevel.DEBUG, "[OrderBook] Atomic matching...");
        return await this.store.atomicMatch(order, quantity);
    }
}
