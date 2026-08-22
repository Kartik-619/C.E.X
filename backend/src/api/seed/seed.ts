// src/api/seed.ts
import { Inmemory_WalletStore } from "../../store/wallet-store";

export async function seedDatabase(walletStore: Inmemory_WalletStore) {
    await walletStore.deposit('alice', 'USD', 1000);
    await walletStore.deposit('bob', 'BTC', 5);
    console.log('✅ Database seeded');
}