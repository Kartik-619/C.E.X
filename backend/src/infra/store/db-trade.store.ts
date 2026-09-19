import type { ITrade } from "../../domain/engine/interface/ITrade";
import type { ITick, ITradeStore } from "../../domain/engine/interface/ITradeStore";
import { getPool } from "../db/connection";

export class DbTradeStore implements ITradeStore {

    async recordTrade(trade: ITrade): Promise<void> {
        const pool = getPool();
        await pool.query(
            `INSERT INTO trades (trade_id, buy_order_id, sell_order_id, buyer_id, seller_id, symbol, price, quantity, total_value, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (trade_id) DO NOTHING`,
            [
                trade.tradeId,
                trade.buyOrderId,
                trade.sellOrderId,
                trade.buyerId,
                trade.sellerId,
                trade.symbol,
                trade.price,
                trade.quantity,
                trade.totalValue,
                trade.timestamp instanceof Date ? trade.timestamp : new Date(trade.timestamp)
            ]
        );
    }

    async recordTick(tick: ITick): Promise<void> {
        const pool = getPool();
        await pool.query(
            `INSERT INTO ticks (tick_id, trade_id, symbol, price, quantity, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (tick_id) DO NOTHING`,
            [
                tick.tickId,
                tick.tradeId,
                tick.symbol,
                tick.price,
                tick.quantity,
                new Date(tick.timestamp)
            ]
        );
    }

    async getRecentTrades(symbol: string, limit: number = 30): Promise<ITrade[]> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM trades
             WHERE symbol = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [symbol, limit]
        );
        return result.rows.map((row) => this.rowToTrade(row));
    }

    async getTradesByUser(userId: string, limit: number = 30): Promise<ITrade[]> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM trades
             WHERE buyer_id = $1 OR seller_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows.map((row) => this.rowToTrade(row));
    }

    async getTicks(symbol: string, limit: number = 30): Promise<ITick[]> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM ticks
             WHERE symbol = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [symbol, limit]
        );
        return result.rows.map((row) => ({
            tickId: row.tick_id as string,
            tradeId: row.trade_id as string,
            symbol: row.symbol as string,
            price: Number(row.price),
            quantity: Number(row.quantity),
            timestamp: new Date(row.created_at as string).getTime(),
        }));
    }

    private rowToTrade(row: Record<string, unknown>): ITrade {
        return {
            tradeId: row.trade_id as string,
            buyOrderId: Number(row.buy_order_id),
            sellOrderId: Number(row.sell_order_id),
            buyerId: row.buyer_id as string,
            sellerId: row.seller_id as string,
            symbol: row.symbol as string,
            price: Number(row.price),
            quantity: Number(row.quantity),
            totalValue: Number(row.total_value),
            timestamp: new Date(row.created_at as string),
        };
    }
}