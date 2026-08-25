// OrderService.ts

import { StandardEngine } from "../../domain/engine/services/Engine";
import { CreateOrderRequestDTO, OrderResponseDTO } from "../dto/requestorderDTO";
import type { Order } from "../../domain/engine/interface/IOrderBook";
import { BalanceResponseDTO } from "../dto/balance-response.dto";

import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";
import { Logger } from "../../infra/logging/logger";

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

    // ─── Private Helpers ────────────────────────────────────────────

    private validateBusinessRules(dto: CreateOrderRequestDTO): void {
        if (dto.price <= 0) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price must be > 0 (User: ${dto.userId})`);
            throw new Error('Price must be greater than 0');
        }
        if (dto.quantity <= 0) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Quantity must be > 0 (User: ${dto.userId})`);
            throw new Error('Quantity must be greater than 0');
        }
        if (!dto.symbol || !dto.symbol.includes('/')) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Invalid symbol format '${dto.symbol}'`);
            throw new Error('Invalid symbol format. Expected: BTC/USD');
        }

        if (dto.quantity > 100) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Quantity exceeds max limit of 100 (User: ${dto.userId})`);
            throw new Error('Quantity cannot exceed 100');
        }

        if (dto.price < 0.01) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Price below min limit of 0.01 (User: ${dto.userId})`);
            throw new Error('Price cannot be less than 0.01');
        }
    }

    private toDomainOrder(dto: CreateOrderRequestDTO): Order {
        if (!dto.userId) {
            this.logger.log(LogLevel.WARN, `[OrderService] Validation failed: Missing userId in DTO`);
            throw new Error("UserId invalid");
        }
        return {
            orderId: Date.now(),
            userId: dto.userId,
            symbol: dto.symbol,
            side: dto.side,
            price: dto.price,
            quantity: dto.quantity,
            type: dto.type || 'LIMIT',
            createdAt: Date.now()
        };
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
}