import { getPool } from './connection';

export async function migrate(): Promise<void> {
    const pool = getPool();

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id              TEXT PRIMARY KEY,
            username        TEXT NOT NULL,
            email           TEXT NOT NULL UNIQUE,
            password_hash   TEXT,
            provider        TEXT NOT NULL DEFAULT 'local',
            provider_user_id TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            order_id    BIGINT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            side        TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
            price       NUMERIC NOT NULL CHECK (price > 0),
            quantity    NUMERIC NOT NULL CHECK (quantity >= 0),
            type        TEXT NOT NULL CHECK (type IN ('LIMIT', 'MARKET')),
            symbol      TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED')),
            created_at  BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_orders_side_price ON orders (side, price);
        CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders (symbol);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS balances (
            user_id   TEXT NOT NULL,
            asset     TEXT NOT NULL,
            available NUMERIC NOT NULL DEFAULT 0 CHECK (available >= 0),
            locked    NUMERIC NOT NULL DEFAULT 0 CHECK (locked >= 0),
            PRIMARY KEY (user_id, asset)
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS trades (
            trade_id      TEXT PRIMARY KEY,
            buy_order_id  BIGINT NOT NULL,
            sell_order_id BIGINT NOT NULL,
            buyer_id      TEXT NOT NULL,
            seller_id     TEXT NOT NULL,
            symbol        TEXT NOT NULL,
            price         NUMERIC NOT NULL,
            quantity      NUMERIC NOT NULL,
            total_value   NUMERIC NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
        CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades (buyer_id);
        CREATE INDEX IF NOT EXISTS idx_trades_seller ON trades (seller_id);
    `);

    console.log('✅ Database migration complete');
}
