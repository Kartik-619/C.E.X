export interface Order{
    orderId:number,
    type:'buy'|'sell',
    price:string,
    entity:string
}