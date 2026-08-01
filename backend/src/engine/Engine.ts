// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import  { OrderBook } from "../orderBook/orderBook";
import type { Order } from "../interface/IOrderBook";

export class StandardEngine extends AbstractEngine<Order> {
    // Executes logic when receiving a new order
  
    // Inject the OrderBook into the Engine
    constructor(orderBook: OrderBook) {
        
        super(orderBook)
    }

    async processOrder(order: Order): Promise<Order> {
        console.log(`[Engine] Received new ${order.type} order for ${order.entity}`);
        
        // Delegate to OrderBook
        const savedOrder = await this.orderBook.placeOrder(order);
        
        // TODO: Future logic -> await this.findMatch(savedOrder);
        
        return savedOrder;
    }

    async cancelOrder(orderId: number): Promise<void> {
        console.log(`[Engine] Requesting cancellation for order ${orderId}`);
        await this.orderBook.cancelOrder(orderId);
    }
}