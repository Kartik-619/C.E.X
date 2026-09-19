// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import type { IOrderBook, Order } from "../interface/IOrderBook";
import type { IWallet } from "../interface/Iwallet";
import type { Balance } from "../interface/Ibalance";
import type { ITrade } from "../interface/ITrade";
import type { ITradeStore } from "../interface/ITradeStore";

import { LoggerFactory } from "../../../infra/logging/logger.factory";
import { LogLevel } from "../../../infra/logging/log-level";
import { Logger } from "../../../infra/logging/logger";
import { EventManager } from "../../events/event-bus";
import { EventType } from "../../events/Ibroadcast.orderbook";

export class StandardEngine extends AbstractEngine<Order> {

    private readonly logger: Logger;
    private readonly tradeStore?: ITradeStore;

    constructor(orderBook: IOrderBook, wallet: IWallet<Balance>, bus: EventManager, tradeStore?: ITradeStore) {
        super(orderBook, wallet, bus);
        this.tradeStore = tradeStore;
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async createOrder(order: Order): Promise<Order> {
        await this.validateOrderBalance(order);
        await this.lockOrderFunds(order);
        return await this.orderBook.placeOrder(order);
    }

    async processOrder(order: Order): Promise<Order> {
        this.logger.log(LogLevel.INFO, `[Engine] Processing order: ${order.orderId}, quantity: ${order.quantity}`);

        // 1. Validate and lock funds
        await this.validateOrderBalance(order);
        await this.lockOrderFunds(order);

        let currentOrder = { ...order };
        let matchedAny = false;

        // 2.  Atomic matching loop
        while (currentOrder.quantity > 0) {
            this.logger.log(LogLevel.DEBUG, `[Engine] Looking for match. Current quantity: ${currentOrder.quantity}`);
            
            //  Use atomicMatch for race-condition-free matching
            const matchedOrder = await this.orderBook.atomicMatch(currentOrder, currentOrder.quantity);

            if (!matchedOrder) {
                this.logger.log(LogLevel.DEBUG, `[Engine] No more matches found`);
                break;
            }

            matchedAny = true;
            this.logger.log(LogLevel.INFO, `[Engine] Atomic match found: Order ${matchedOrder.orderId} at price ${matchedOrder.price}, qty: ${matchedOrder.quantity}`);

            // The order book already updated the remaining quantity in place
            const trade = this.createTrade(matchedOrder, currentOrder);
            await this.wallet.settleTrade(trade);

            // Persist the executed trade and its price tick after settlement
            if (this.tradeStore) {
                await this.tradeStore.recordTrade(trade);
                await this.tradeStore.recordTick({
                    tickId: crypto.randomUUID(),
                    tradeId: trade.tradeId,
                    symbol: trade.symbol,
                    price: trade.price,
                    quantity: trade.quantity,
                    timestamp: trade.timestamp.getTime()
                });
            }

            // Track this order's residual lock as fills settle at the executed price
            if (currentOrder.side === "buy") {
                currentOrder.lockedAmount -= trade.totalValue;
            } else {
                currentOrder.lockedAmount -= trade.quantity;
            }

            currentOrder.quantity -= trade.quantity;
            this.logger.log(LogLevel.DEBUG, `[Engine] Current order remaining: ${currentOrder.quantity}`);
            
        
        }

        // 3. Emit events based on result
        if (currentOrder.quantity > 0) {
            // Partially filled - remaining order goes to book
            const remainingOrder = {
                ...currentOrder,
                quantity: currentOrder.quantity
            };
            
            this.bus.notify(EventType.ORDER_PLACED, {
                orderId: currentOrder.orderId,
                userId: currentOrder.userId,
                symbol: currentOrder.symbol,
                side: currentOrder.side,
                price: currentOrder.price,
                quantity: currentOrder.quantity,
                status: 'PARTIALLY_FILLED',
                timestamp: Date.now()
            });
            
            await this.orderBook.placeOrder(remainingOrder);
            this.logger.log(LogLevel.INFO, `[Engine] Order ${order.orderId} partially filled, ${currentOrder.quantity} remaining`);
            
        } else if (matchedAny) {
            // Fully filled. A buy filled at a price below its limit still holds
            // (limitPrice - fillPrice) locked per unit; release that residual.
            if (currentOrder.lockedAmount > 0) {
                const [baseAsset, quoteAsset] = currentOrder.symbol.split("/");
                const residualAsset = currentOrder.side === "buy" ? quoteAsset : baseAsset;

                if (!residualAsset) {
                    throw new Error(`Invalid trading pair: ${currentOrder.symbol}`);
                }

                await this.wallet.unlockFunds(currentOrder.userId, residualAsset, currentOrder.lockedAmount);
                this.logger.log(LogLevel.INFO, `[Engine] Released residual locked funds ${currentOrder.lockedAmount} ${residualAsset} for order ${order.orderId}`);
            }
            // Fully filled
            this.bus.notify(EventType.ORDER_FILLED, {
                orderId: order.orderId,
                userId: order.userId,
                symbol: order.symbol,
                side: order.side,
                price: order.price,
                quantity: order.quantity,
                status: 'FILLED',
                timestamp: Date.now()
            });
            this.logger.log(LogLevel.INFO, `[Engine] Order ${order.orderId} fully filled`);
            
        } else {
            // No match found - place as resting order
            await this.orderBook.placeOrder({
                ...currentOrder,
                quantity: currentOrder.quantity
            });
            
            this.bus.notify(EventType.ORDER_PLACED, {
                orderId: currentOrder.orderId,
                userId: currentOrder.userId,
                symbol: currentOrder.symbol,
                side: currentOrder.side,
                price: currentOrder.price,
                quantity: currentOrder.quantity,
                status: 'OPEN',
                timestamp: Date.now()
            });
            
            this.logger.log(LogLevel.WARN, `[Engine] No matches found for order ${order.orderId}`);
        }

        return currentOrder;
    }

    private async lockOrderFunds(order: Order): Promise<void> {
        const [baseAsset, quoteAsset] = order.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            this.bus.notify(EventType.ORDER_FAILED, {
                orderId: order.orderId,
                userId: order.userId,
                symbol: order.symbol,
                reason: 'Invalid trading pair format',
                invalidValue: order.symbol,
                timestamp: Date.now()
            });
            throw new Error(`Invalid trading pair: ${order.symbol}`);
        }

        if (order.side === "buy") {
            const amount = order.price * order.quantity;
            order.lockedAmount = amount;
            await this.wallet.lockFunds(order.userId, quoteAsset, amount);
        } else {
            order.lockedAmount = order.quantity;
            await this.wallet.lockFunds(order.userId, baseAsset, order.quantity);
        }
    }

    async cancelOrder(orderId: number): Promise<void> {
        this.logger.log(LogLevel.INFO, `[Engine] Requesting cancellation for order ${orderId}`);

        const order = await this.orderBook.getOrder(orderId);

        if (!order) {
            this.bus.notify(EventType.ORDER_FAILED, {
                orderId: orderId,
                reason: 'Order not found',
                timestamp: Date.now()
            });
            throw new Error("Order can't be found");
        }

        const [baseAsset, quoteAsset] = order.symbol.split("/");

        if (!baseAsset || !quoteAsset) {
            this.bus.notify(EventType.ORDER_FAILED, {
                orderId: order.orderId,
                userId: order.userId,
                symbol: order.symbol,
                reason: 'Invalid symbol format',
                timestamp: Date.now()
            });
            throw new Error(`Invalid symbol: ${order.symbol}`);
        }

        const asset = order.side === "buy" ? quoteAsset : baseAsset;
        // Exact residual lock for tracked orders; nominal fallback for legacy
        // orders placed before lockedAmount bookkeeping existed.
        const amount = order.lockedAmount > 0
            ? order.lockedAmount
            : (order.side === "buy" ? order.price * order.quantity : order.quantity);

        await this.wallet.unlockFunds(order.userId, asset, amount);
        await this.orderBook.cancelOrder(orderId);
        
        this.bus.notify(EventType.ORDER_CANCELLED, {
            orderId: order.orderId,
            userId: order.userId,
            symbol: order.symbol,
            side: order.side,
            price: order.price,
            quantity: order.quantity,
            status: 'CANCELLED',
            timestamp: Date.now()
        });
        this.logger.log(LogLevel.INFO, `[Engine] Successfully cancelled order ${orderId} and unlocked ${amount} ${asset}`);
    }

    async getBalance(userId: string, asset: string) {
        return this.wallet.getBalance(userId, asset);
    }

    async hasWallet(userId: string): Promise<boolean> {
        return this.wallet.exists(userId);
    }

    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        this.logger.log(LogLevel.INFO, `[Engine] Depositing ${amount} ${asset} for user: ${userId}`);
        await this.wallet.deposit(userId, asset, amount);
    }

    async getOrderBook(): Promise<Order[]> {
        return await this.orderBook.getOrderBook();
    }

    async getBestBuy(): Promise<Order | null> {
        return await this.orderBook.getBestBid();
    }

    async getBestSell(): Promise<Order | null> {
        return await this.orderBook.getBestAsk();
    }

    async getMatch(order: Order) {
        return await this.orderBook.findBestMatch(order);
    }

    private async getBestMatch(order: Order): Promise<Order | null> {
        if (order.side === "buy") {
            const bestAsk = await this.getBestSell();
            if (!bestAsk) return null;
            if (bestAsk.price > order.price) return null;
            if (bestAsk.quantity <= 0) return null;
            return bestAsk;
        }

        const bestBid = await this.getBestBuy();
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
                this.logger.log(LogLevel.WARN, `Insufficient ${quoteAsset} balance for buyer ${order.userId}`);
                this.bus.notify(EventType.ORDER_FAILED, {
                    orderId: order.orderId,
                    userId: order.userId,
                    symbol: order.symbol,
                    reason: 'Insufficient balance',
                    required: totalCost,
                    available: balance.available,
                    timestamp: Date.now()
                });
                throw new Error(
                    `Insufficient ${quoteAsset} balance for buyer ${order.userId}. ` +
                    `Need ${totalCost}, have ${balance.available}`
                );
            }
        } else if (order.side === 'sell') {
            const balance = await this.wallet.getBalance(order.userId, baseAsset);

            if (balance.available < order.quantity) {
                this.logger.log(LogLevel.WARN, `Insufficient ${baseAsset} balance for seller ${order.userId}`);
                this.bus.notify(EventType.ORDER_FAILED, {
                    orderId: order.orderId,
                    userId: order.userId,
                    symbol: order.symbol,
                    reason: 'Insufficient balance',
                    required: order.quantity,
                    available: balance.available,
                    timestamp: Date.now()
                });
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
        const timestamp = new Date();

        const trade: ITrade = {
            tradeId: crypto.randomUUID(),
            buyOrderId: buyOrder.orderId,
            sellOrderId: sellOrder.orderId,
            buyerId: buyOrder.userId,
            sellerId: sellOrder.userId,
            symbol: buyOrder.symbol,
            price: price,
            quantity: quantity,
            totalValue: totalValue,
            timestamp: timestamp
        };

        this.bus.notify(EventType.TRADE_EXECUTED, {
            tradeId: trade.tradeId,
            buyOrderId: trade.buyOrderId,
            sellOrderId: trade.sellOrderId,
            buyerId: trade.buyerId,
            sellerId: trade.sellerId,
            symbol: trade.symbol,
            price: trade.price,
            quantity: trade.quantity,
            totalValue: trade.totalValue,
            timestamp: trade.timestamp
        });

        return trade;
    }
}