import type { ITrade } from "../../domain/engine/interface/ITrade";
import type { ITick, ITradeStore } from "../../domain/engine/interface/ITradeStore";

export class Inmemory_TradeStore implements ITradeStore {
    private trades: ITrade[] = [];
    private ticks: ITick[] = [];

    async recordTrade(trade: ITrade): Promise<void> {
        const existing = this.trades.some((t) => t.tradeId === trade.tradeId);
        if (!existing) {
            this.trades.push({ ...trade });
        }
    }

    async recordTick(tick: ITick): Promise<void> {
        const existing = this.ticks.some((t) => t.tickId === tick.tickId);
        if (!existing) {
            this.ticks.push({ ...tick });
        }
    }

    async getRecentTrades(symbol: string, limit: number = 30): Promise<ITrade[]> {
        return this.trades
            .filter((trade) => trade.symbol === symbol)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    async getTradesByUser(userId: string, limit: number = 30): Promise<ITrade[]> {
        return this.trades
            .filter((trade) => trade.buyerId === userId || trade.sellerId === userId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    async getTicks(symbol: string, limit: number = 30): Promise<ITick[]> {
        return this.ticks
            .filter((tick) => tick.symbol === symbol)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}