import type { ITrade } from "./ITrade";

export interface ITick {
    tickId: string;
    tradeId: string;
    symbol: string;
    price: number;
    quantity: number;
    timestamp: number;
}

export interface ITradeStore {
    recordTrade(trade: ITrade): Promise<void>;
    recordTick(tick: ITick): Promise<void>;
    getRecentTrades(symbol: string, limit?: number): Promise<ITrade[]>;
    getTradesByUser(userId: string, limit?: number): Promise<ITrade[]>;
    getTicks(symbol: string, limit?: number): Promise<ITick[]>;
}