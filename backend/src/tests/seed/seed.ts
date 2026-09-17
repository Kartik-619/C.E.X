import type { IWallet } from "../../domain/engine/interface/Iwallet";
import type { Balance } from "../../domain/engine/interface/Ibalance";

export async function seedDatabase(walletStore: IWallet<Balance>) {
    await walletStore.deposit('alice', 'USD', 1000);
    await walletStore.deposit('bob', 'BTC', 5);
    console.log('✅ Database seeded');
}
