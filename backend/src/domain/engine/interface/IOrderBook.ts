export interface IOrderBook {
    placeOrder(order: Order): Promise<Order>;
    cancelOrder(orderId: number): Promise<void>;
    updateOrder(orderId: number, quantity: number): Promise<Order>;
    getOrder(orderId: number): Promise<Order | null>;
    getBestBid(): Promise<Order | null>;
    getBestAsk(): Promise<Order | null>;
    getOrderBook(): Promise<Order[]>;
    findBestMatch(order: Order): Promise<Order | null>;
    atomicMatch(order: Order, quantity: number): Promise<Order | null>;
}

export interface Order{
    orderId:number,
    userId:string,
    side:'buy'|'sell',
    price:number,
    type:'LIMIT'|'MARKET',
    createdAt:number,
    quantity:number,
    symbol:string,
    // Amount currently locked in the wallet for this order.
    // buy -> quote amount (price * quantity), sell -> base quantity.
    // Decremented as fills settle so cancellation releases exactly the residual.
    lockedAmount:number
}