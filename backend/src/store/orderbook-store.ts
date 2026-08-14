import type { IOrderBook, Order } from "../engine/interface/IOrderBook";

export class inmemory_OrderBookStore implements IOrderBook{
    private list=new Map<number,Order>();
    private asks:Order[]=[];
    private bids:Order[]=[];
    async placeOrder(order:Order): Promise<Order> {
        this.list.set(order.orderId,order);

        if(order.side==='buy'){
           this.bids.push(order)
        }else  if(order.side==='sell'){
            this.asks.push(order)
        }

        console.log("adding ",order)
        return order
    }
    async cancelOrder(orderId:number): Promise<void> {
        if (this.list.has(orderId)) {
            this.bids = this.bids.filter(o => o.orderId !== orderId);
            this.asks = this.asks.filter(o => o.orderId !== orderId);
            this.list.delete(orderId);
            
            console.log("removing :", orderId);
        }
        return Promise.resolve()
    }
    getBestBid(): Order | null {
        let best = this.bids[0] ?? null;  
        if (!best) return null;  
        for (const order of this.bids) {
            if (order.price > best.price) {
                best = order;
            }
        }
        return best;
    }
    getBestAsk():Order|null{
        let best = this.asks[0] ?? null;  
        if (!best) return null;  
        for (const order of this.asks) {
            if (order.price < best.price) {
                best = order;
            }
        }
        return best;
    }

    getOrderBook(): Order[] {
        // Convert Map values back to an array if you need to view/print them
        return Array.from(this.list.values());
    }
    async findBestMatch(order: Order): Promise<Order|null> {
        if(order.side==='buy'){
            return await this.getBestAsk()
        }else if(order.side==='sell'){
            return await this.getBestBid()
        }
        return null
    }
}