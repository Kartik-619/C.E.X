export interface IOrderBook<T>{
    placeOrder(order:T):Promise<T>;
    cancelOrder(orderId:number):Promise<void>; 
    //findMatch for future 

}