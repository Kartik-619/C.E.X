// src/tests/unit/db-wallet.store.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import type { Pool } from 'pg';
import { DbWalletStore } from '../../infra/store/db-wallet.store';
import { DEFAULT_WALLET_ASSETS } from '../../infra/store/wallet-assets';

// ─── Test Doubles ──────────────────────────────────────────────────

interface RecordedQuery {
    sql: string;
    params: unknown[];
}

class FakePool {
    readonly queries: RecordedQuery[] = [];
    private readonly results: { rows: Record<string, unknown>[] }[] = [];

    queue(rows: Record<string, unknown>[]): void {
        this.results.push({ rows });
    }

    query = async (sql: string, params: unknown[] = []): Promise<{ rows: Record<string, unknown>[] }> => {
        this.queries.push({ sql, params });
        const next = this.results.shift();
        return next ?? { rows: [] };
    };

    asPool(): Pool {
        return this as unknown as Pool;
    }

    lastQuery(): RecordedQuery {
        const query = this.queries[this.queries.length - 1];
        if (!query) throw new Error('No query was executed');
        return query;
    }
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('DbWalletStore', () => {
    let fakePool: FakePool;
    let store: DbWalletStore;

    beforeEach(() => {
        fakePool = new FakePool();
        store = new DbWalletStore(() => fakePool.asPool());
    });

    describe('createWallet', () => {
        it('should insert a zero balance row for every default asset', async () => {
            await store.createWallet('user-1');

            const { sql, params } = fakePool.lastQuery();
            expect(sql).toContain('INSERT INTO balances');
            expect(sql).toContain('ON CONFLICT');
            expect(params[0]).toBe('user-1');
            expect(params[1]).toEqual(DEFAULT_WALLET_ASSETS);
        });

        it('should make the wallet exist for the created user', async () => {
            await store.createWallet('user-1');
            fakePool.queue([{ asset: 'USD' }]);

            expect(await store.exists('user-1')).toBe(true);
        });

        it('should reject an empty userId', async () => {
            await expect(store.createWallet('')).rejects.toThrow('Invalid User');
            expect(fakePool.queries).toHaveLength(0);
        });
    });

    describe('exists', () => {
        it('should return true when the user has a balance row', async () => {
            fakePool.queue([{ asset: 'USD' }]);

            expect(await store.exists('user-1')).toBe(true);
        });

        it('should return false when the user has no balance row', async () => {
            expect(await store.exists('user-1')).toBe(false);
        });

        it('should reject an empty userId', async () => {
            await expect(store.exists('')).rejects.toThrow('Invalid User');
        });
    });

    describe('getBalance', () => {
        it('should return a zero balance when no row exists', async () => {
            const balance = await store.getBalance('user-1', 'USD');

            expect(balance).toEqual({ available: 0, locked: 0 });
        });

        it('should return numeric amounts from the stored row', async () => {
            fakePool.queue([{ available: '1500', locked: '250' }]);

            const balance = await store.getBalance('user-1', 'USD');

            expect(balance).toEqual({ available: 1500, locked: 250 });
        });

        it('should query the row for the requested user and asset', async () => {
            await store.getBalance('user-1', 'BTC');

            const { sql, params } = fakePool.lastQuery();
            expect(sql).toContain('FROM balances');
            expect(params).toEqual(['user-1', 'BTC']);
        });

        it('should reject an empty userId', async () => {
            await expect(store.getBalance('', 'USD')).rejects.toThrow('Invalid User');
        });
    });

    describe('deposit', () => {
        it('should upsert the balance row with the deposited amount', async () => {
            await store.deposit('user-1', 'USD', 500);

            const { sql, params } = fakePool.lastQuery();
            expect(sql).toContain('INSERT INTO balances');
            expect(sql).toContain('ON CONFLICT');
            expect(params).toEqual(['user-1', 'USD', 500]);
        });

        it('should reject an empty userId', async () => {
            await expect(store.deposit('', 'USD', 500)).rejects.toThrow('Invalid User');
        });
    });
});
