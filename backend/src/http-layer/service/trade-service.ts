// TradeService.ts

import type { ITradeStore } from "../../domain/engine/interface/ITradeStore";
import type { ITrade } from "../../domain/engine/interface/ITrade";
import type { ITick } from "../../domain/engine/interface/ITradeStore";
import { TradeResponseDTO, TickResponseDTO } from "../dto/trade-response.dto";

import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";
import { Logger } from "../../infra/logging/logger";

const DEFAULT_SYMBOL = 'BTC/USD';
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 200;

export class TradeService {
    private readonly logger: Logger;

    constructor(private tradeStore: ITradeStore) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    // Recent market trades for a symbol (public feed)
    async getRecentTrades(symbol?: string, limit?: number): Promise<TradeResponseDTO[]> {
        const resolvedSymbol = this.resolveSymbol(symbol);
        const resolvedLimit = this.resolveLimit(limit);

        this.logger.log(LogLevel.INFO, `[TradeService] Fetching recent trades for ${resolvedSymbol} (limit: ${resolvedLimit})`);

        const trades = await this.tradeStore.getRecentTrades(resolvedSymbol, resolvedLimit);
        return trades.map((trade) => this.toTradeDTO(trade));
    }

    // Recent tick stream for a symbol (public market data)
    async getTicks(symbol?: string, limit?: number): Promise<TickResponseDTO[]> {
        const resolvedSymbol = this.resolveSymbol(symbol);
        const resolvedLimit = this.resolveLimit(limit);

        this.logger.log(LogLevel.INFO, `[TradeService] Fetching ticks for ${resolvedSymbol} (limit: ${resolvedLimit})`);

        const ticks = await this.tradeStore.getTicks(resolvedSymbol, resolvedLimit);
        return ticks.map((tick) => this.toTickDTO(tick));
    }

    // Trades involving a specific user (auth-scoped history)
    async getUserTrades(userId: string, limit?: number): Promise<TradeResponseDTO[]> {
        if (!userId) {
            this.logger.log(LogLevel.WARN, `[TradeService] Fetch failed: Invalid userId provided`);
            throw new Error('User ID is required');
        }

        const resolvedLimit = this.resolveLimit(limit);

        this.logger.log(LogLevel.INFO, `[TradeService] Fetching trades for user: ${userId} (limit: ${resolvedLimit})`);

        const trades = await this.tradeStore.getTradesByUser(userId, resolvedLimit);
        return trades.map((trade) => this.toTradeDTO(trade));
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private resolveSymbol(symbol?: string): string {
        if (!symbol || typeof symbol !== 'string') return DEFAULT_SYMBOL;
        const normalized = symbol.trim().toUpperCase();
        if (!normalized.includes('/')) {
            this.logger.log(LogLevel.WARN, `[TradeService] Invalid symbol format: '${symbol}'`);
            throw new Error('Invalid symbol format. Expected: BTC/USD');
        }
        return normalized;
    }

    private resolveLimit(limit?: number): number {
        if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT;
        return Math.min(Math.floor(limit), MAX_LIMIT);
    }

    private toTradeDTO(trade: ITrade): TradeResponseDTO {
        return {
            tradeId: trade.tradeId,
            symbol: trade.symbol,
            price: trade.price,
            quantity: trade.quantity,
            totalValue: trade.totalValue,
            timestamp: trade.timestamp.toISOString(),
            buyOrderId: trade.buyOrderId,
            sellOrderId: trade.sellOrderId,
            buyerId: trade.buyerId,
            sellerId: trade.sellerId
        };
    }

    private toTickDTO(tick: ITick): TickResponseDTO {
        return {
            tradeId: tick.tradeId,
            symbol: tick.symbol,
            price: tick.price,
            quantity: tick.quantity,
            timestamp: tick.timestamp
        };
    }
}