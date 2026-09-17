import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        pool = new Pool(
            connectionString
                ? {
                      connectionString,
                      max: 20,
                      idleTimeoutMillis: 30000,
                      connectionTimeoutMillis: 5000,
                  }
                : {
                      host: process.env.DB_HOST || 'localhost',
                      port: Number(process.env.DB_PORT) || 5432,
                      database: process.env.DB_NAME || 'cex',
                      user: process.env.DB_USER || 'postgres',
                      password: process.env.DB_PASSWORD || 'postgres',
                      max: 20,
                      idleTimeoutMillis: 30000,
                      connectionTimeoutMillis: 5000,
                  }
        );
    }
    return pool;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
