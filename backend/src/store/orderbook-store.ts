import type { IOrderBook, Order } from "../interface/IOrderBook";

export class inmemory_OrderBookStore implements IOrderBook<Order>{
    private list=new Map<number,Order>();
    async placeOrder(order:Order): Promise<Order> {
        this.list.set(order.orderId,order);
        console.log("adding ",order)
        return order
    }
    async cancelOrder(orderId:number): Promise<void> {
        if (this.list.has(orderId)) {
            this.list.delete(orderId);
            console.log("removing :", orderId);
        }
        return Promise.resolve()
    }

    getOrderBook(): Order[] {
        // Convert Map values back to an array if you need to view/print them
        return Array.from(this.list.values());
    }
}