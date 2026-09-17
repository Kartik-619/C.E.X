import type { IWallet } from "../../domain/engine/interface/Iwallet";
import type { Balance } from "../../domain/engine/interface/Ibalance";
import type { Logger } from "../../infra/logging/logger";
import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";

export async function seedDatabase(walletStore: IWallet<Balance>, logger?: Logger) {
    const activeLogger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);

    await walletStore.deposit('alice', 'USD', 1000);
    await walletStore.deposit('bob', 'BTC', 5);
    activeLogger.log(LogLevel.INFO, '[Seed] Database seeded');
}