import type { IWallet } from "../../domain/engine/interface/Iwallet";
import type { Balance } from "../../domain/engine/interface/Ibalance";
import type { ITradeStore } from "../../domain/engine/interface/ITradeStore";
import type { ITrade } from "../../domain/engine/interface/ITrade";
import type { Logger } from "../../infra/logging/logger";
import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";

const SEEDED_TRADE_COUNT = 60;
const SEEDED_HISTORY_DAYS = 7;
const SEED_SYMBOL = 'BTC/USD';

// Deterministic PRNG so the seeded market is stable across restarts.
function mulberry32(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

export async function seedDatabase(walletStore: IWallet<Balance>, tradeStore: ITradeStore, logger?: Logger) {
    const activeLogger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);

    await walletStore.deposit('alice', 'USD', 1000);
    await walletStore.deposit('bob', 'BTC', 5);

    await seedTradeHistory(tradeStore, activeLogger);

    activeLogger.log(LogLevel.INFO, '[Seed] Database seeded');
}

export async function seedTradeHistory(tradeStore: ITradeStore, logger?: Logger) {
    const activeLogger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);
    const random = mulberry32(0xC0FFEE);

    const now = Date.now();
    const windowMs = SEEDED_HISTORY_DAYS * 24 * 60 * 60 * 1000;
    const startTs = now - windowMs;

    let previousPrice = 42000;

    for (let i = 0; i < SEEDED_TRADE_COUNT; i++) {
        const progress = i / (SEEDED_TRADE_COUNT - 1);
        const trendPrice = 41000 + 11000 * progress;
        const noise = (random() * 2 - 1) * 900;
        const price = round(Math.max(previousPrice + (trendPrice - previousPrice) * 0.2 + noise, 0.01), 2);
        previousPrice = price;

        const quantity = round(0.05 + random() * 1.45, 4);
        const totalValue = round(price * quantity, 2);

        const timestampMs = Math.floor(startTs + windowMs * progress + (random() * 2 - 1) * (windowMs / SEEDED_TRADE_COUNT) * 0.5);
        const clampedTimestamp = Math.min(Math.max(timestampMs, startTs), now);

        // Alternate the aggressor so both demo users accumulate history.
        const aliceBuys = random() > 0.5;
        const trade: ITrade = {
            tradeId: `seed-trade-${String(i + 1).padStart(4, '0')}`,
            buyOrderId: 900000 + i,
            sellOrderId: 800000 + i,
            buyerId: aliceBuys ? 'alice' : 'bob',
            sellerId: aliceBuys ? 'bob' : 'alice',
            symbol: SEED_SYMBOL,
            price,
            quantity,
            totalValue,
            timestamp: new Date(clampedTimestamp)
        };

        await tradeStore.recordTrade(trade);
        await tradeStore.recordTick({
            tickId: `seed-tick-${String(i + 1).padStart(4, '0')}`,
            tradeId: trade.tradeId,
            symbol: SEED_SYMBOL,
            price,
            quantity,
            timestamp: clampedTimestamp
        });
    }

    activeLogger.log(LogLevel.INFO, `[Seed] Seeded ${SEEDED_TRADE_COUNT} historical trades + ticks for ${SEED_SYMBOL}`);
}