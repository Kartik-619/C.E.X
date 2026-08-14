export interface ITrade {
    tradeId: number;
    buyOrderId: number;
    sellOrderId: number;

    buyerId: string;
    sellerId: string;

    symbol: string;
    price: number;
    quantity: number;
}