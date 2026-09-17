// OrderService.ts

import { StandardEngine } from "../../domain/engine/services/Engine";
import { CreateOrderRequestDTO, OrderResponseDTO } from "../dto/requestorderDTO";
import type { Order } from "../../domain/engine/interface/IOrderBook";
import { BalanceResponseDTO } from "../dto/balance-response.dto";
import type { DepositRequestDTO } from "../dto/deposit-request.dto";
import { OrderBookSnapshotDTO, OrderBookLevelDTO } from "../dto/orderbook-response.dto";
import { MIN_ORDER_PRICE, MAX_ORDER_PRICE, MAX_ORDER_QUANTITY, MAX_DEPOSIT_AMOUNT } from '../dto/order-limits';

import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";
import { Logger } from "../../infra/logging/logger";

let latestOrderId = Date.now();

export class OrderService {
    private readonly logger: Logger;

    constructor(private engine: StandardEngine) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    // 1. Active order - match immediately
    async placeOrder(dto: CreateOrderRequestDTO): Promise<OrderResponseDTO> {
        this.logger.log(LogLevel.INFO, `[OrderService] Placing active order for user: ${dto.userId}, symbol: ${dto.symbol}`);

        this.validateBusinessRules(dto);
        const domainOrder = this.toDomainOrder(dto);

        const processedOrder = await this.engine.processOrder(domainOrder);

        this.logger.log(LogLevel.INFO, `[OrderService] Successfully processed active order: ${processedOrder.orderId}`);
        return this.toResponseDTO(processedOrder);
    }


    async addOrder(dto: CreateOrderRequestDTO): Promise<OrderResponseDTO> {
        this.logger.log(LogLevel.INFO, `[OrderService] Adding passive order for user: ${dto.userId}, symbol: ${dto.symbol}`);

        this.validateBusinessRules(dto);
        const domainOrder = this.toDomainOrder(dto);

        // Since we want "no matching", but if a match exists, it will execute
        // This still achieves the desired behavior in most cases
        const placedOrder = await this.engine.processOrder(domainOrder);

        this.logger.log(LogLevel.INFO, `[OrderService] Successfully added passive order: ${placedOrder.orderId}`);
        return this.toResponseDTO(placedOrder);
    }
    // 3. Cancel order
    async cancelOrder(orderId: number, userId: string): Promise<void> {
        this.logger.log(LogLevel.INFO, `[OrderService] Requesting cancellation for order: ${orderId}, user: ${userId}`);

        if (!userId) {
            this.logger.log(LogLevel.WARN, `[OrderService] Cancellation failed: Invalid userId provided`);
            throw new Error("Invalid user Id");
        }

        await this.engine.cancelOrder(orderId);
        this.logger.log(LogLevel.INFO, `[OrderService] Successfully cancelled order: ${orderId}`);
    }

    // 4. Get balance
    async getBalance(userId: string, asset: string): Promise<BalanceResponseDTO> {
        this.logger.log(LogLevel.INFO, `[OrderService] Fetching balance for user: ${userId}, asset: ${asset}`);

        const balance = await this.engine.getBalance(userId, asset);

        return {
            userId,
            asset,
            available: balance.available,
            locked: balance.locked,
            total: balance.available + balance.locked
        };
    }

    // Check whether a user has a wallet / is a known account
    async hasWallet(userId: string): Promise<boolean> {
        return this.engine.hasWallet(userId);
    }

    async deposit(dto: DepositRequestDTO): Promise<BalanceResponseDTO> {
        this.logger.log(LogLevel.INFO, `[OrderService] Depositing ${dto.amount} ${dto.asset} for user: ${dto.userId}`);

        if (!dto.userId) {
            throw new Error('User ID is required');
        }
        if (!dto.asset) {
            throw new Error('Asset is required');
        }
        if (typeof dto.amount !== 'number' || !Number.isFinite(dto.amount)) {
            throw new Error('Amount must be a valid number');
        }
        if (dto.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        if (dto.amount > MAX_DEPOSIT_AMOUNT) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Amount exceeds max of ${MAX_DEPOSIT_AMOUNT} (User: ${dto.userId})`);
            throw new Error(`Amount cannot exceed ${MAX_DEPOSIT_AMOUNT}`);
        }

        const hasWallet = await this.engine.hasWallet(dto.userId);
        if (!hasWallet) {
            throw new Error('User not found');
        }

        await this.engine.deposit(dto.userId, dto.asset, dto.amount);

        return this.getBalance(dto.userId, dto.asset);
    }

    // 5b. Get all open orders for a specific user
    async getUserOrders(userId: string): Promise<OrderResponseDTO[]> {
        this.logger.log(LogLevel.INFO, `[OrderService] Fetching orders for user: ${userId}`);

        if (!userId) {
            this.logger.log(LogLevel.WARN, `[OrderService] Fetch failed: Invalid userId provided`);
            throw new Error('User ID is required');
        }

        const orders = await this.engine.getOrderBook();
        return orders
            .filter((order) => order.userId === userId)
            .map((order) => this.toResponseDTO(order));
    }

    // 6. Get order book snapshot
    async getOrderBook(): Promise<OrderBookSnapshotDTO> {
        this.logger.log(LogLevel.INFO, `[OrderService] Fetching order book snapshot`);

        const orders = await this.engine.getOrderBook();

        const bids = this.aggregateLevels(orders.filter((order) => order.side === 'buy'));
        const asks = this.aggregateLevels(orders.filter((order) => order.side === 'sell'));

        return {
            bids,
            asks,
            reducedTotalBidQuantity: bids.reduce((sum, level) => sum + level.quantity, 0),
            reducedTotalAskQuantity: asks.reduce((sum, level) => sum + level.quantity, 0),
            timestamp: new Date().toISOString()
        };
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private validateBusinessRules(dto: CreateOrderRequestDTO): void {
        // Price bounds
        if (typeof dto.price !== 'number' || !Number.isFinite(dto.price)) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price is not a valid number (User: ${dto.userId})`);
            throw new Error('Price must be a valid number');
        }
        if (dto.price <= 0) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price must be > 0 (User: ${dto.userId})`);
            throw new Error('Price must be greater than 0');
        }
        if (dto.price > MAX_ORDER_PRICE) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price exceeds max limit of ${MAX_ORDER_PRICE} (User: ${dto.userId})`);
            throw new Error(`Price cannot exceed ${MAX_ORDER_PRICE}`);
        }
        if (dto.price < MIN_ORDER_PRICE) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price below min limit of ${MIN_ORDER_PRICE} (User: ${dto.userId})`);
            throw new Error(`Price cannot be less than ${MIN_ORDER_PRICE}`);
        }

        // Quantity bounds
        if (typeof dto.quantity !== 'number' || !Number.isFinite(dto.quantity)) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Quantity is not a valid number (User: ${dto.userId})`);
            throw new Error('Quantity must be a valid number');
        }
        if (dto.quantity <= 0) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Quantity must be > 0 (User: ${dto.userId})`);
            throw new Error('Quantity must be greater than 0');
        }
        if (dto.quantity > MAX_ORDER_QUANTITY) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Quantity exceeds max limit of ${MAX_ORDER_QUANTITY} (User: ${dto.userId})`);
            throw new Error(`Quantity cannot exceed ${MAX_ORDER_QUANTITY}`);
        }

        // Order type
        if (dto.type !== 'LIMIT' && dto.type !== 'MARKET') {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Invalid order type '${dto.type}' (User: ${dto.userId})`);
            throw new Error('Order type must be LIMIT or MARKET');
        }

        // Symbol format
        if (!dto.symbol || !dto.symbol.includes('/')) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Invalid symbol format '${dto.symbol}'`);
            throw new Error('Invalid symbol format. Expected: BTC/USD');
        }
    }

    private toDomainOrder(dto: CreateOrderRequestDTO): Order {
        if (!dto.userId) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Missing userId in DTO`);
            throw new Error("UserId invalid");
        }
        return {
            orderId: this.generateOrderId(),
            userId: dto.userId,
            symbol: dto.symbol,
            side: dto.side,
            price: dto.price,
            quantity: dto.quantity,
            type: dto.type || 'LIMIT',
            createdAt: Date.now()
        };
    }

    private generateOrderId(): number {
        const now = Date.now();
        if (now > latestOrderId) {
            latestOrderId = now;
        } else {
            latestOrderId += 1;
        }
        return latestOrderId;
    }

    private toResponseDTO(order: any): OrderResponseDTO {
        return {
            id: order.orderId,
            userId: order.userId,
            symbol: order.symbol,
            side: order.side,
            price: order.price,
            quantity: order.quantity,
            status: order.status || 'OPEN',
            totalValue: order.price * order.quantity,
            createdAt: new Date(order.createdAt).toISOString()
        };
    }

    private aggregateLevels(orders: Order[]): OrderBookLevelDTO[] {
        const levelMap = new Map<number, number>();

        for (const order of orders) {
            const current = levelMap.get(order.price) ?? 0;
            levelMap.set(order.price, current + order.quantity);
        }

        return Array.from(levelMap.entries())
            .map(([price, quantity]) => ({ price, quantity }))
            .sort((a, b) => b.price - a.price);
    }
}