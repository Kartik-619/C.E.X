import { EventType } from "./Ibroadcast.orderbook";

export interface EventPayload<T> {
    type: EventType;
    data: T;
    timestamp: number;
}

export interface OrderPlacedPayload {
    orderId: number;
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    status: string;
}

export interface TradeExecutedPayload {
    tradeId: number;
    buyOrderId: number;
    sellOrderId: number;
    price: number;
    quantity: number;
    totalValue: number;
    symbol: string;
}

export interface OrderFilledPayload {
    orderId: number;
    userId: string;
    price: number;
    quantity: number;
    status: string;
}