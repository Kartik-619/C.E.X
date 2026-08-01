export interface IOrderBook<T>{
    placeOrder(order:T):Promise<T>;
    cancelOrder(orderId:number):Promise<void>; 
    //findMatch for future 

}

export interface Order{
    orderId:number,
    type:'buy'|'sell',
    price:string,
    entity:string
}