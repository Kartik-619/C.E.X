import type { Balance } from "../engine/interface/Ibalance";
import type { IWallet } from "../engine/interface/Iwallet";
import type { ITrade } from "../engine/interface/ITrade";
export class Inmemory_WalletStore implements IWallet<Balance> {
    private balance: Map<string, Map<string, Balance>>
    constructor() {
        this.balance = new Map();
    }

    async getBalance(userId: string, asset: string): Promise<Balance> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        const userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        const currentBalance = userBalance?.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
        return currentBalance;
    }



    async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
        if (currentBalance.available< amount) {
            throw new Error(`Insufficient ${asset} balance for user ${userId}`);
        }
        currentBalance.available -= amount;
        currentBalance.locked += amount;
    };
    async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
        if (currentBalance.locked< amount) {
            throw new Error(`Insufficient ${asset} balance for user ${userId}`);
        }
        currentBalance.locked -= amount;
        currentBalance.available +=amount;

    };
    // Settlement operations
    async settleTrade(trade: ITrade): Promise<void> {
        // Validate trade
        if (!trade.buyerId || !trade.sellerId || !trade.symbol) {
            throw new Error('Invalid trade data: missing buyer, seller, or symbol');
        }
        
        if (trade.price <= 0 || trade.quantity <= 0) {
            throw new Error('Invalid trade price or quantity');
        }

        const cashAmount = trade.price * trade.quantity;
        const assetSymbol = trade.symbol.split('/')[0];
        
        if (!assetSymbol) {
            throw new Error(`Invalid symbol format: ${trade.symbol}`);
        }

        // Get buyer's balances
        let buyerBalance = this.balance.get(trade.buyerId);
        if (!buyerBalance) {
            buyerBalance = new Map();
            this.balance.set(trade.buyerId, buyerBalance);
        }
        
        // Get seller's balances
        let sellerBalance = this.balance.get(trade.sellerId);
        if (!sellerBalance) {
            sellerBalance = new Map();
            this.balance.set(trade.sellerId, sellerBalance);
        }

        // --- BUYER SIDE ---
        // 1. Deduct cash from buyer
        let buyerCash = buyerBalance.get(trade.symbol);
        if (!buyerCash) {
            buyerCash = { available: 0, locked: 0 };
            buyerBalance.set(trade.symbol, buyerCash);
        }
        
        if (buyerCash.available < cashAmount) {
            throw new Error(`Insufficient funds for buyer ${trade.buyerId}. Need ${cashAmount}, have ${buyerCash.available}`);
        }
        buyerCash.available -= cashAmount;
        
        // 2. Credit asset to buyer
        let buyerAsset = buyerBalance.get(assetSymbol);
        if (!buyerAsset) {
            buyerAsset = { available: 0, locked: 0 };
            buyerBalance.set(assetSymbol, buyerAsset);
        }
        buyerAsset.available += trade.quantity;

        // --- SELLER SIDE ---
        // 3. Deduct asset from seller
        let sellerAsset = sellerBalance.get(assetSymbol);
        if (!sellerAsset) {
            sellerAsset = { available: 0, locked: 0 };
            sellerBalance.set(assetSymbol, sellerAsset);
        }
        
        if (sellerAsset.available < trade.quantity) {
            throw new Error(`Insufficient asset for seller ${trade.sellerId}. Need ${trade.quantity}, have ${sellerAsset.available}`);
        }
        sellerAsset.available -= trade.quantity;
        
        // 4. Credit cash to seller
        let sellerCash = sellerBalance.get(trade.symbol);
        if (!sellerCash) {
            sellerCash = { available: 0, locked: 0 };
            sellerBalance.set(trade.symbol, sellerCash);
        }
        sellerCash.available += cashAmount;
    }

    // Administrative operations
    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            userBalance = new Map;
            this.balance.set(userId, userBalance);
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            currentBalance = { available: 0, locked: 0 }
            userBalance.set(asset, currentBalance);
        }
        currentBalance.available += amount;
    };
    // async initialize(): Promise<void>{} };


}