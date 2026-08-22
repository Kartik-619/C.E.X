// OrderService.ts

import { StandardEngine } from "../../engine/services/Engine";
import { CreateOrderRequestDTO, OrderResponseDTO } from "../dto/requestorderDTO";
import type { Order } from "../../engine/interface/IOrderBook";
import { BalanceResponseDTO } from "../dto/balance-response.dto";

export class OrderService {
    constructor(private engine: StandardEngine) {}

    // 1. Active order - match immediately
    async placeOrder(dto: CreateOrderRequestDTO): Promise<OrderResponseDTO> {
        this.validateBusinessRules(dto);
        const domainOrder = this.toDomainOrder(dto);
        const processedOrder = await this.engine.processOrder(domainOrder);
        return this.toResponseDTO(processedOrder);
    }

    // 2. Passive order - just add to book (NO matching)
    async addOrder(dto: CreateOrderRequestDTO): Promise<OrderResponseDTO> {
        this.validateBusinessRules(dto);
        const domainOrder = this.toDomainOrder(dto);
        
        
        const placedOrder = await this.engine.processOrder(domainOrder);
        return this.toResponseDTO(placedOrder);
    }

    // 3. Cancel order
    async cancelOrder(orderId: number, userId: string): Promise<void> {
        if (!userId) {
            throw new Error("Invalid user Id");
        }
        await this.engine.cancelOrder(orderId);
    }

    // 4. Get balance
    async getBalance(userId: string, asset: string): Promise<BalanceResponseDTO> {
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
            throw new Error('Price must be greater than 0');
        }
        if (dto.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (!dto.symbol || !dto.symbol.includes('/')) {
            throw new Error('Invalid symbol format. Expected: BTC/USD');
        }
        
        // ✅ Add max quantity validation
        if (dto.quantity > 100) {
            throw new Error('Quantity cannot exceed 100');
        }
        
        // ✅ Add min price validation
        if (dto.price < 0.01) {
            throw new Error('Price cannot be less than 0.01');
        }
    }

    private toDomainOrder(dto: CreateOrderRequestDTO): Order {
        if (!dto.userId) {
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