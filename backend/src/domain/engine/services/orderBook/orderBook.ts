import type { Order, IOrderBook } from "../../interface/IOrderBook";
import type { inmemory_OrderBookStore } from "../../../../infra/store/orderbook-store";

export class OrderBook implements IOrderBook {
    private store: inmemory_OrderBookStore;
    
    constructor(store: inmemory_OrderBookStore) {
        this.store = store;
    }

    async placeOrder(order: Order): Promise<Order> {
        if (order.price <= 0) {
            throw new Error("Invalid price");
        }

        console.log("[OrderBook] Processing order placement...");
        return await this.store.placeOrder(order);
    }

    async cancelOrder(orderId: number): Promise<void> {
        console.log("[OrderBook] Processing order cancellation...");
        await this.store.cancelOrder(orderId);
    }

  async updateOrder( orderId:number, quantity:number): Promise<Order> {
        const order =await this.store.getOrder(orderId);
        if(!order){
            throw new Error(" Not found")
        }
        console.log("[OrderBook] Processing order update...");
        return  await this.store.updateOrder(orderId,quantity);
        
    }

    async getOrder(orderId: number): Promise<Order | null> {
        console.log("[OrderBook] Getting order...");
        return await this.store.getOrder(orderId);
    }

    getBestBid(): Order | null {
        return this.store.getBestBid();
    }

    getBestAsk(): Order | null {
        return this.store.getBestAsk();
    }

    getOrderBook(): Order[] {
        return this.store.getOrderBook();
    }

    async findBestMatch(order: Order): Promise<Order | null> {
        console.log("[OrderBook] Finding best match...");
        return await this.store.findBestMatch(order);  // ✅ Fixed: delegate to store
    }

    // Helper methods
    getOrdersBySide(side: 'buy' | 'sell'): Order[] {
        return this.store.getOrdersBySide(side);
    }

    getOrderCount(): number {
        return this.store.getOrderCount();
    }

    clearAllOrders(): void {
        this.store.clearAllOrders();
    }

    getBestPrice(side: 'buy' | 'sell'): number | null {
        return this.store.getBestPrice(side);
    }
}