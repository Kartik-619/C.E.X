export class TradeResponseDTO {
    tradeId!: string;
    symbol!: string;
    price!: number;
    quantity!: number;
    totalValue!: number;
    timestamp!: string;
    buyOrderId!: number;
    sellOrderId!: number;
    buyerId!: string;
    sellerId!: string;
}

export class TickResponseDTO {
    tradeId!: string;
    symbol!: string;
    price!: number;
    quantity!: number;
    timestamp!: number;
}