// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/MatchEngine";
import type { Order } from "../interface/Order";

export class StandardEngine extends AbstractEngine<Order> {
    // Executes logic when receiving a new order
    async processOrder(order: Order): Promise<Order> {
        console.log("Processing order in engine:", order.orderId);
        
        // Orchestrate placing order into the orderbook
        return await this.orderBook.placeOrder(order);
    }

    // Delegates order cancellation to the orderbook
    async cancelOrder(orderId: number): Promise<void> {
        console.log("Cancelling order in engine:", orderId);
        await this.orderBook.cancelOrder(orderId);
    }
}