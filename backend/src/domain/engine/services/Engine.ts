// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import { OrderBook } from "./orderBook/orderBook";
import type { Order } from "../interface/IOrderBook";
import type { Wallet } from "./wallet/wallet";
import type { ITrade } from "../interface/ITrade";

import { LoggerFactory } from "../../../infra/logging/logger.factory"; 
import { LogLevel } from "../../../infra/logging/log-level";
import { Logger } from "../../../infra/logging/logger";

export class StandardEngine extends AbstractEngine<Order> {
    
    private readonly logger: Logger;

    constructor(orderBook: OrderBook, wallet: Wallet) {
        super(orderBook, wallet);
        
        // You can also read this from an environment variable or config
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async createOrder(order: Order): Promise<Order> {
        await this.validateOrderBalance(order);
        await this.lockOrderFunds(order);
        return await this.orderBook.placeOrder(order);
    }

    async processOrder(order: Order): Promise<Order> {
        this.logger.log(LogLevel.INFO, `[Engine] Processing order: ${order.orderId}, quantity: ${order.quantity}`);

        await this.validateOrderBalance(order);
        await this.lockOrderFunds(order);

        let currentOrder = { ...order };
        let matchedAny = false;

        while (currentOrder.quantity > 0) {
            this.logger.log(LogLevel.DEBUG, `[Engine] Looking for match. Current quantity: ${currentOrder.quantity}`);
            const bestMatch = await this.getBestMatch(currentOrder);

            if (!bestMatch) {
                this.logger.log(LogLevel.DEBUG, `[Engine] No more matches found`);
                break;
            }

            matchedAny = true;
            this.logger.log(LogLevel.INFO, `[Engine] Match found: Order ${bestMatch.orderId} at price ${bestMatch.price}, qty: ${bestMatch.quantity}`);

            const matchedOrder = { ...bestMatch };
            await this.orderBook.cancelOrder(bestMatch.orderId);

            const trade = this.createTrade(matchedOrder, currentOrder);
            await this.wallet.settleTrade(trade);

            currentOrder.quantity -= trade.quantity;
            this.logger.log(LogLevel.DEBUG, `[Engine] Current order remaining: ${currentOrder.quantity}`);

            // ✅ If matched order has remaining, place it back
            if (matchedOrder.quantity > trade.quantity) {
                matchedOrder.quantity -= trade.quantity;
                await this.orderBook.placeOrder(matchedOrder);
                this.logger.log(LogLevel.INFO, `[Engine] Matched order ${matchedOrder.orderId} has ${matchedOrder.quantity} remaining, placed back`);
            }
        }

        if (currentOrder.quantity > 0) {
            await this.orderBook.placeOrder({
                ...currentOrder,
                quantity: currentOrder.quantity
            });
            this.logger.log(LogLevel.INFO, `[Engine] Order ${order.orderId} partially filled, ${currentOrder.quantity} remaining`);
        } else if (matchedAny) {
            this.logger.log(LogLevel.INFO, `[Engine] Order ${order.orderId} fully filled`);
        } else {
            this.logger.log(LogLevel.WARN, `[Engine] No matches found for order ${order.orderId}`);
        }

        return currentOrder;
    }

    private async lockOrderFunds(order: Order): Promise<void> {
        const [baseAsset, quoteAsset] = order.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid trading pair: ${order.symbol}`);
        }

        if (order.side === "buy") {
            const amount = order.price * order.quantity;
            await this.wallet.lockFunds(order.userId, quoteAsset, amount);
        } else {
            await this.wallet.lockFunds(order.userId, baseAsset, order.quantity);
        }
    }

    async cancelOrder(orderId: number): Promise<void> {
        this.logger.log(LogLevel.INFO, `[Engine] Requesting cancellation for order ${orderId}`);

        const order = await this.orderBook.getOrder(orderId);

        if (!order) {
            throw new Error("Order can't be found");
        }

        const [baseAsset, quoteAsset] = order.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid symbol: ${order.symbol}`);
        }

        const asset = order.side === "buy" ? quoteAsset : baseAsset;
        const amount = order.side === "buy" ? order.price * order.quantity : order.quantity;

        await this.wallet.unlockFunds(order.userId, asset, amount);
        await this.orderBook.cancelOrder(orderId);
        
        this.logger.log(LogLevel.INFO, `[Engine] Successfully cancelled order ${orderId} and unlocked funds`);
    }

    async getBalance(userId: string, asset: string) {
        return this.wallet.getBalance(userId, asset);
    }

    getBestBuy(): Order | null {
        return this.orderBook.getBestBid();
    }

    getBestSell(): Order | null {
        return this.orderBook.getBestAsk();
    }

    async getMatch(order: Order) {
        return this.orderBook.findBestMatch(order);
    }

    private async getBestMatch(order: Order): Promise<Order | null> {
        if (order.side === "buy") {
            const bestAsk = this.getBestSell();
            if (!bestAsk) return null;
            if (bestAsk.price > order.price) return null;
            if (bestAsk.quantity <= 0) return null;
            return bestAsk;
        }

        const bestBid = this.getBestBuy();
        if (!bestBid) return null;
        if (bestBid.price < order.price) return null;
        if (bestBid.quantity <= 0) return null;
        return bestBid;
    }

    private async validateOrderBalance(order: Order): Promise<void> {
        const [baseAsset, quoteAsset] = order.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid trading pair: ${order.symbol}`);
        }

        if (order.side === 'buy') {
            const totalCost = order.price * order.quantity;
            const balance = await this.wallet.getBalance(order.userId, quoteAsset);

            if (balance.available < totalCost) {
                this.logger.log(LogLevel.WARN, `Insufficient ${quoteAsset} balance for buyer ${order.userId}. Need ${totalCost}, have ${balance.available}`);
                throw new Error(
                    `Insufficient ${quoteAsset} balance for buyer ${order.userId}. ` +
                    `Need ${totalCost}, have ${balance.available}`
                );
            }
        } else if (order.side === 'sell') {
            const balance = await this.wallet.getBalance(order.userId, baseAsset);

            if (balance.available < order.quantity) {
                this.logger.log(LogLevel.WARN, `Insufficient ${baseAsset} balance for seller ${order.userId}. Need ${order.quantity}, have ${balance.available}`);
                throw new Error(
                    `Insufficient ${baseAsset} balance for seller ${order.userId}. ` +
                    `Need ${order.quantity}, have ${balance.available}`
                );
            }
        }
    }

    private createTrade(order1: Order, order2: Order): ITrade {
        const buyOrder = order1.side === 'buy' ? order1 : order2;
        const sellOrder = order1.side === 'sell' ? order1 : order2;

        const price = sellOrder.price;
        const quantity = Math.min(buyOrder.quantity, sellOrder.quantity);
        const totalValue = price * quantity;

        return {
            tradeId: Date.now() + Math.floor(Math.random() * 1000),
            buyOrderId: buyOrder.orderId,
            sellOrderId: sellOrder.orderId,
            buyerId: buyOrder.userId,
            sellerId: sellOrder.userId,
            symbol: buyOrder.symbol,
            price: price,
            quantity: quantity,
            totalValue: totalValue,
            timestamp: new Date()
        };
    }
}