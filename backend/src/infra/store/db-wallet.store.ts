import type { IWallet } from "../../domain/engine/interface/Iwallet";
import type { Balance } from "../../domain/engine/interface/Ibalance";
import type { ITrade } from "../../domain/engine/interface/ITrade";
import { getPool } from "../db/connection";

export class DbWalletStore implements IWallet<Balance> {

    async getBalance(userId: string, asset: string): Promise<Balance> {
        if (!userId) throw new Error("Invalid User");

        const pool = getPool();
        const result = await pool.query(
            `SELECT available, locked FROM balances WHERE user_id = $1 AND asset = $2`,
            [userId, asset]
        );

        if (result.rows.length === 0) {
            return { available: 0, locked: 0 };
        }

        return {
            available: Number(result.rows[0].available),
            locked: Number(result.rows[0].locked),
        };
    }

    async checkBalance(userId: string, asset: string, amount: number): Promise<boolean> {
        if (!userId) throw new Error("Invalid User");

        const balance = await this.getBalance(userId, asset);
        return balance.available >= amount;
    }

    async exists(userId: string): Promise<boolean> {
        if (!userId) throw new Error("Invalid User");

        const pool = getPool();
        const result = await pool.query(
            `SELECT 1 FROM balances WHERE user_id = $1 LIMIT 1`,
            [userId]
        );
        return result.rows.length > 0;
    }

    async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) throw new Error("Invalid User");

        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `SELECT available, locked FROM balances
                 WHERE user_id = $1 AND asset = $2
                 FOR UPDATE`,
                [userId, asset]
            );

            if (result.rows.length === 0) {
                throw new Error(`Insufficient ${asset} balance for user ${userId}`);
            }

            const available = Number(result.rows[0].available);

            if (available < amount) {
                throw new Error(`Insufficient ${asset} balance for user ${userId}`);
            }

            await client.query(
                `UPDATE balances
                 SET available = available - $1, locked = locked + $1
                 WHERE user_id = $2 AND asset = $3`,
                [amount, userId, asset]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) throw new Error("Invalid User");

        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `SELECT available, locked FROM balances
                 WHERE user_id = $1 AND asset = $2
                 FOR UPDATE`,
                [userId, asset]
            );

            if (result.rows.length === 0) {
                throw new Error(`Invalid User`);
            }

            const locked = Number(result.rows[0].locked);

            if (locked < amount) {
                throw new Error(`Insufficient locked ${asset} balance for user ${userId}`);
            }

            await client.query(
                `UPDATE balances
                 SET locked = locked - $1, available = available + $1
                 WHERE user_id = $2 AND asset = $3`,
                [amount, userId, asset]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async settleTrade(trade: ITrade): Promise<void> {
        if (!trade.buyerId || !trade.sellerId || !trade.symbol) {
            throw new Error("Invalid trade data: missing buyer, seller, or symbol");
        }

        if (trade.price <= 0 || trade.quantity <= 0) {
            throw new Error("Invalid trade price or quantity");
        }

        const [baseAsset, quoteAsset] = trade.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid trading pair: ${trade.symbol}`);
        }

        const tradeValue = trade.price * trade.quantity;
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Lock buyer's balances
            const buyerQuote = await client.query(
                `SELECT available, locked FROM balances
                 WHERE user_id = $1 AND asset = $2
                 FOR UPDATE`,
                [trade.buyerId, quoteAsset]
            );

            if (buyerQuote.rows.length === 0) {
                throw new Error(`Buyer ${trade.buyerId} has no ${quoteAsset} balance`);
            }

            const buyerLocked = Number(buyerQuote.rows[0].locked);
            if (buyerLocked < tradeValue) {
                throw new Error(`Buyer ${trade.buyerId} does not have enough locked ${quoteAsset}`);
            }

            // Lock seller's balances
            const sellerBase = await client.query(
                `SELECT available, locked FROM balances
                 WHERE user_id = $1 AND asset = $2
                 FOR UPDATE`,
                [trade.sellerId, baseAsset]
            );

            if (sellerBase.rows.length === 0) {
                throw new Error(`Seller ${trade.sellerId} has no ${baseAsset} balance`);
            }

            const sellerLocked = Number(sellerBase.rows[0].locked);
            if (sellerLocked < trade.quantity) {
                throw new Error(`Seller ${trade.sellerId} does not have enough locked ${baseAsset}`);
            }

            // Buyer: consume locked USD, receive BTC
            await client.query(
                `UPDATE balances SET locked = locked - $1 WHERE user_id = $2 AND asset = $3`,
                [tradeValue, trade.buyerId, quoteAsset]
            );

            // Upsert buyer's base asset
            await client.query(
                `INSERT INTO balances (user_id, asset, available, locked)
                 VALUES ($1, $2, $3, 0)
                 ON CONFLICT (user_id, asset)
                 DO UPDATE SET available = balances.available + $3`,
                [trade.buyerId, baseAsset, trade.quantity]
            );

            // Seller: consume locked BTC, receive USD
            await client.query(
                `UPDATE balances SET locked = locked - $1 WHERE user_id = $2 AND asset = $3`,
                [trade.quantity, trade.sellerId, baseAsset]
            );

            // Upsert seller's quote asset
            await client.query(
                `INSERT INTO balances (user_id, asset, available, locked)
                 VALUES ($1, $2, $3, 0)
                 ON CONFLICT (user_id, asset)
                 DO UPDATE SET available = balances.available + $3`,
                [trade.sellerId, quoteAsset, tradeValue]
            );

            // Record the trade
            await client.query(
                `INSERT INTO trades (trade_id, buy_order_id, sell_order_id, buyer_id, seller_id, symbol, price, quantity, total_value)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [trade.tradeId, trade.buyOrderId, trade.sellOrderId, trade.buyerId, trade.sellerId, trade.symbol, trade.price, trade.quantity, trade.totalValue]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) throw new Error("Invalid User");

        const pool = getPool();
        await pool.query(
            `INSERT INTO balances (user_id, asset, available, locked)
             VALUES ($1, $2, $3, 0)
             ON CONFLICT (user_id, asset)
             DO UPDATE SET available = balances.available + $3`,
            [userId, asset, amount]
        );
    }

    async createWallet(userId: string): Promise<void> {
        if (!userId) throw new Error("Invalid User");
        // Wallets are created lazily on first deposit or balance check
    }
}
