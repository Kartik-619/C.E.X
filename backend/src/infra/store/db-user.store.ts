import type { User } from "../../domain/auth/userI";
import type { IUserStore } from "./Iuser.store";
import { getPool } from "../db/connection";

export class DbUserStore implements IUserStore {

    async createUser(username: string, email: string, passwordHash: string | null, provider: string = 'local', providerUserId: string | null = null): Promise<User> {
        const pool = getPool();
        const id = crypto.randomUUID();
        const now = new Date();

        await pool.query(
            `INSERT INTO users (id, username, email, password_hash, provider, provider_user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, username, email, passwordHash, provider, providerUserId, now, now]
        );

        return {
            id,
            username,
            email,
            passwordHash,
            provider,
            providerUserId,
            createdAt: now,
            updatedAt: now,
        };
    }

    async findByEmail(email: string): Promise<User | null> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );
        if (result.rows.length === 0) return null;
        return this.rowToUser(result.rows[0]);
    }

    async findById(id: string): Promise<User | null> {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) return null;
        return this.rowToUser(result.rows[0]);
    }

    async delete(email: string): Promise<boolean> {
        const pool = getPool();
        const result = await pool.query(
            `DELETE FROM users WHERE email = $1`,
            [email]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async clearAll(): Promise<void> {
        const pool = getPool();
        await pool.query(`DELETE FROM users`);
    }

    async count(): Promise<number> {
        const pool = getPool();
        const result = await pool.query(`SELECT COUNT(*) as count FROM users`);
        return Number(result.rows[0].count);
    }

    private rowToUser(row: Record<string, unknown>): User {
        return {
            id: row.id as string,
            username: row.username as string,
            email: row.email as string,
            passwordHash: row.password_hash as string | null,
            provider: (row.provider as string) || 'local',
            providerUserId: (row.provider_user_id as string) || null,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
        };
    }
}
