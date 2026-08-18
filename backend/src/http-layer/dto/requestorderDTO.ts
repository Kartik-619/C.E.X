// src/api/dto/request/CreateOrderRequestDTO.ts

// This is a plain object - just data, no behavior!
export class CreateOrderRequestDTO {
    // Required fields
    userId: string | undefined;
    symbol!: string;
    side!: 'buy' | 'sell';
    price!: number;
    quantity!: number;
    
    // Optional field with default
    type: 'LIMIT' | 'MARKET' = 'LIMIT';
}

// src/api/dto/response/OrderResponseDTO.ts
export class OrderResponseDTO {
    id!: number;
    userId!: string;
    symbol!: string;
    side!: string;
    price!: number;
    //add status
    quantity!: number;
    totalValue!: number;
    createdAt!: string;
}