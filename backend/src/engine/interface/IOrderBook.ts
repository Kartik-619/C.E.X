export interface IOrderBook{
   
    placeOrder(order:Order):Promise<Order>;
    cancelOrder(orderId:number):Promise<void>; 
    getBestAsk():Order|null;
    getBestBid():Order|null;
    getOrderBook(): Order[];
    findBestMatch(order:Order):Promise<Order|null>;
    //findMatch for future 

}

export interface Order{
    orderId:number,
    userId:number,
    side:'buy'|'sell',
    price:number,
    type:'LIMIT'|'MARKET',
    createdAt:number,
    quantity:number,
    symbol:string
}