import type { IOrderBook } from "../interface/I_OrderBook";
import type { Order } from "../interface/Order";

export class OrderBook  implements IOrderBook<Order>{
    private list:Order[]=[];
    constructor(){

    }

    async placeOrder(order:Order): Promise<Order> {
        this.list.push(order);
        console.log("adding ",order)
        return order
    }
    async cancelOrder(orderId:number): Promise<void> {
        const orderToRemove = this.list.find(i => i.orderId === orderId);
        
        if (orderToRemove) {
            // 8. JavaScript arrays DO NOT have a .remove() method. 
            // Use .filter() to create a new array excluding the cancelled order.
            this.list = this.list.filter(i => i.orderId !== orderId);
            console.log("removing :",orderId)
        }
        return Promise.resolve()
    }

    getOrderBook(){
        console.log("the list is :",this.list);
        return this.list;
    }
}