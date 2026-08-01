import type { Order,IOrderBook } from "../interface/IOrderBook";
import type { inmemory_OrderBookStore } from "../../store/orderbook-store";

export class OrderBook  implements IOrderBook<Order>{
    private store:inmemory_OrderBookStore;
    constructor(store:inmemory_OrderBookStore ){
    this.store=store;
    }

    async placeOrder(order:Order): Promise<Order> {
        if (order.price <= "0") {
            throw new Error("Invalid price");
        }

        console.log("[OrderBook] Processing order placement...");
        
       return await this.store.placeOrder(order)
    }
    async cancelOrder(orderId: number): Promise<void> {
        console.log("[OrderBook] Processing order cancellation...");
        
        // Delegate to the storage layer
        await this.store.cancelOrder(orderId);
    }

    getOrderBook(): Order[] {
        return this.store.getOrderBook();
    }
}