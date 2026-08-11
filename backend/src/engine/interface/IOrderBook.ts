export interface IOrderBook{
    placeOrder(order:Order):Promise<Order>;
    cancelOrder(orderId:number):Promise<void>; 
    //findMatch for future 

}

export interface Order{
    orderId:number,
    side:'buy'|'sell',
    price:number,
    entity:string,
    type:'LIMIT'|'MARKET'
}