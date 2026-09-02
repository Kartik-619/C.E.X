import type { IOrderBook, Order } from "../../domain/engine/interface/IOrderBook";
import { getPool } from "../db/connection";
import type { PoolClient } from "pg";

export class DbOrderBookStore implements IOrderBook {

    async placeOrder(order: Order): Promise<Order> {
        const pool = getPool();
        await pool.query(
            `INSERT INTO orders (order_id, user_id, side, price, quantity, type, symbol, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', $8)`,
            [order.orderId, order.userId, order.side, order.price, order.quantity, order.type, order.symbol, order.createdAt]
        );
        return order;
    }

    async cancelOrder(orderId: number): Promise<void> {
        const pool = getPool();
        await pool.query(
            `DELETE FROM orders WHERE order_id = $1`,
            [orderId]
        );
    }

    async updateOrder(orderId: number, quantity: number): Promise<Order> {
        const pool = getPool();

        if (quantity === 0) {
            const result = await pool.query(
                `DELETE FROM orders WHERE order_id = $1 RETURNING *`,
                [orderId]
            );
            if (result.rows.length === 0) {
                throw new Error(`Order ${orderId} not found`);
            }
            return this.rowToOrder({ ...result.rows[0], quantity: 0 });
        }

        if (quantity < 0) {
            throw new Error("Quantity cannot be negative");
        }

        const result = await pool.query(
            `UPDATE orders SET quantity = $1 WHERE order_id = $2 RETURNING *`,
            [quantity, orderId]
        );
        if (result.rows.length === 0) {
            throw new Error(`Order ${orderId} not found`);
        }
        return this.rowToOrder(result.rows[0]);
    }

    async getOrder(orderId: number): Promise<Order | null> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM orders WHERE order_id = $1`,
            [orderId]
        );
        if (result.rows.length === 0) return null;
        return this.rowToOrder(result.rows[0]);
    }

    async getBestBid(): Promise<Order | null> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM orders
             WHERE side = 'buy' AND status = 'OPEN' AND symbol = 'BTC/USD'
             ORDER BY price DESC, created_at ASC
             LIMIT 1`
        );
        if (result.rows.length === 0) return null;
        return this.rowToOrder(result.rows[0]);
    }

    async getBestAsk(): Promise<Order | null> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM orders
             WHERE side = 'sell' AND status = 'OPEN' AND symbol = 'BTC/USD'
             ORDER BY price ASC, created_at ASC
             LIMIT 1`
        );
        if (result.rows.length === 0) return null;
        return this.rowToOrder(result.rows[0]);
    }

    async getOrderBook(): Promise<Order[]> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM orders WHERE status = 'OPEN' ORDER BY created_at ASC`
        );
        return result.rows.map(row => this.rowToOrder(row));
    }

    async findBestMatch(order: Order): Promise<Order | null> {
        if (order.side === 'buy') {
            const bestAsk = await this.getBestAsk();
            if (!bestAsk) return null;
            if (bestAsk.price > order.price) return null;
            if (bestAsk.quantity <= 0) return null;
            return bestAsk;
        } else {
            const bestBid = await this.getBestBid();
            if (!bestBid) return null;
            if (bestBid.price < order.price) return null;
            if (bestBid.quantity <= 0) return null;
            return bestBid;
        }
    }

    async atomicMatch(order: Order, quantity: number): Promise<Order | null> {
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const matchColumn = order.side === 'buy' ? 'sell' : 'buy';
            const priceOp = order.side === 'buy' ? '<=' : '>=';
            const sortDir = order.side === 'buy' ? 'ASC' : 'DESC';

            const lockResult = await client.query(
                `SELECT * FROM orders
                 WHERE side = $1 AND status = 'OPEN' AND symbol = $2
                 ORDER BY price ${sortDir}, created_at ASC
                 LIMIT 1
                 FOR UPDATE`,
                [matchColumn, order.symbol]
            );

            if (lockResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const matchedRow = lockResult.rows[0];
            const matchedPrice = Number(matchedRow.price);

            if (order.side === 'buy' && matchedPrice > order.price) {
                await client.query('ROLLBACK');
                return null;
            }
            if (order.side === 'sell' && matchedPrice < order.price) {
                await client.query('ROLLBACK');
                return null;
            }

            const matchedQty = Number(matchedRow.quantity);
            const tradeQty = Math.min(quantity, matchedQty);
            const remaining = matchedQty - tradeQty;

            let returnedOrder: Order;

            if (remaining > 0) {
                await client.query(
                    `UPDATE orders SET quantity = $1 WHERE order_id = $2`,
                    [remaining, matchedRow.order_id]
                );
                returnedOrder = this.rowToOrder({ ...matchedRow, quantity: tradeQty });
            } else {
                await client.query(
                    `DELETE FROM orders WHERE order_id = $1`,
                    [matchedRow.order_id]
                );
                returnedOrder = this.rowToOrder(matchedRow);
            }

            await client.query('COMMIT');
            return returnedOrder;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private rowToOrder(row: any): Order {
        return {
            orderId: Number(row.order_id),
            userId: row.user_id,
            side: row.side as 'buy' | 'sell',
            price: Number(row.price),
            quantity: Number(row.quantity),
            type: row.type as 'LIMIT' | 'MARKET',
            symbol: row.symbol,
            createdAt: Number(row.created_at),
        };
    }
}
