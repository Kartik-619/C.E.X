// src/http-layer/dto/orderbook-response.dto.ts

export class OrderBookLevelDTO {
    price!: number;
    quantity!: number;
}

export class OrderBookSnapshotDTO {
    bids!: OrderBookLevelDTO[];
    asks!: OrderBookLevelDTO[];
    reducedTotalBidQuantity!: number;
    reducedTotalAskQuantity!: number;
    timestamp!: string;
}
