// src/http-layer/dto/requestorderDTO.ts

export class CreateOrderRequestDTO {
    userId!: string;
    symbol!: string;
    side!: 'buy' | 'sell';
    price!: number;
    quantity!: number;
    type: 'LIMIT' | 'MARKET' = 'LIMIT';
}

export class CancelOrderRequestDTO {
    orderId!: number;
    userId!: string;
}

export class OrderResponseDTO {
    id!: number;
    userId!: string;
    symbol!: string;
    side!: string;
    price!: number;
    quantity!: number;
    status!: string;
    totalValue!: number;
    createdAt!: string;
}