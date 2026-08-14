// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import { OrderBook } from "./orderBook/orderBook";
import type { Order } from "../interface/IOrderBook";
import type { Wallet } from "./wallet/wallet";

export class StandardEngine extends AbstractEngine<Order> {
    // Executes logic when receiving a new order
    
    // Inject the OrderBook and Wallet into the Engine
    constructor(orderBook: OrderBook, wallet: Wallet) {
        super(orderBook, wallet); // Must call super first!
       
    }

    async processOrder(order: Order): Promise<Order> {
        console.log(`[Engine] Received new ${order.type} order for ${order.symbol}`);
        
        // Delegate to OrderBook
        const savedOrder = await this.orderBook.placeOrder(order);
        
        // TODO: Future logic -> await this.findMatch(savedOrder);
        
        return savedOrder;
    }

    async cancelOrder(orderId: number): Promise<void> {
        console.log(`[Engine] Requesting cancellation for order ${orderId}`);
        await this.orderBook.cancelOrder(orderId);
    }

    async getBalance(userId: string, asset: string) {
        return this.wallet.getBalance(userId, asset);
    }

    getBestBuy():Order|null{
        return this.orderBook.getBestAsk();
    }
    getBestSell():Order|null{
        return this.orderBook.getBestAsk();
    }
    async getMatch(order:Order){
        return this.orderBook.findBestMatch(order);
    }
    //implement settle tradebes
}