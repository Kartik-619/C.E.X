export interface ITrade {
    tradeId:string;
    buyOrderId: number;
    sellOrderId: number;

    buyerId: string;
    sellerId: string;

    symbol: string;
    price: number;
    quantity: number;
    totalValue:number;
    timestamp:Date;
}