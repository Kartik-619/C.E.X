// ../controller/OrderController.ts

import type { OrderService } from '../service/order-service';
import type { CreateOrderRequestDTO, CancelOrderRequestDTO } from '../dto/requestorderDTO';

import { LoggerFactory } from "../../infra/logging/logger.factory"; 
import { LogLevel } from "../../infra/logging/log-level";
import { Logger } from "../../infra/logging/logger";


export class OrderController {
    private readonly logger: Logger;

    constructor(private orderService: OrderService) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    // 1. Active order - match immediately
    async placeOrder(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[OrderController] Received placeOrder request`);
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                this.logger.log(LogLevel.WARN, `[OrderController] Invalid request body for placeOrder`);
                return this.errorResponse('Invalid request body', 400);
            }

            const dto: CreateOrderRequestDTO = {
                userId: body.userId,
                symbol: body.symbol,
                side: body.side,
                price: Number(body.price),
                quantity: Number(body.quantity),
                type: body.type || 'LIMIT'
            };

            this.validateCreateOrder(dto);

            const result = await this.orderService.placeOrder(dto);
            this.logger.log(LogLevel.INFO, `[OrderController] Successfully placed order for user: ${dto.userId}, symbol: ${dto.symbol}`);
            return this.successResponse(result, 201);

        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[OrderController] Error in placeOrder: ${error.message}`);
            return this.errorResponse(error); // Validation errors are typically 400
        }
    }

    // 2. Passive order - just add to book (no matching)
    async addOrder(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[OrderController] Received addOrder request`);
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                this.logger.log(LogLevel.WARN, `[OrderController] Invalid request body for addOrder`);
                return this.errorResponse('Invalid request body', 400);
            }

            const dto: CreateOrderRequestDTO = {
                userId: body.userId,
                symbol: body.symbol,
                side: body.side,
                price: Number(body.price),
                quantity: Number(body.quantity),
                type: body.type || 'LIMIT'
            };

            this.validateCreateOrder(dto);

            await this.orderService.addOrder(dto);
            this.logger.log(LogLevel.INFO, `[OrderController] Successfully added order for user: ${dto.userId}, symbol: ${dto.symbol}`);
            return this.successResponse({ message: 'Order added successfully' }, 201);
            
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[OrderController] Error in addOrder: ${error.message}`);
            return this.errorResponse(error, 400);
        }
    }

    // 3. Cancel order
    async cancelOrder(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[OrderController] Received cancelOrder request`);
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                this.logger.log(LogLevel.WARN, `[OrderController] Invalid request body for cancelOrder`);
                return this.errorResponse('Invalid request body', 400);
            }

            if (!body.orderId) {
                this.logger.log(LogLevel.WARN, `[OrderController] Missing orderId for cancelOrder`);
                return this.errorResponse('Order ID is required', 400);
            }
            if (!body.userId) {
                this.logger.log(LogLevel.WARN, `[OrderController] Missing userId for cancelOrder`);
                return this.errorResponse('User ID is required', 400);
            }

            const dto: CancelOrderRequestDTO = {
                orderId: Number(body.orderId),
                userId: body.userId
            };

            await this.orderService.cancelOrder(dto.orderId, dto.userId);
            this.logger.log(LogLevel.INFO, `[OrderController] Successfully cancelled order: ${dto.orderId} for user: ${dto.userId}`);
            return this.successResponse({ message: 'Order cancelled successfully' }, 200);
            
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[OrderController] Error in cancelOrder: ${error.message}`);
            return this.errorResponse(error); // Or 500 depending on the specific error
        }
    }

    // 4. Get balance
    async getBalance(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[OrderController] Received getBalance request`);
        try {
            const url = new URL(request.url);
            const userId = url.pathname.split('/').pop();
            const asset = url.searchParams.get('asset') || 'USD';

            if (!userId) {
                this.logger.log(LogLevel.WARN, `[OrderController] Missing userId in getBalance request`);
                return this.errorResponse('User ID is required', 400);
            }

            const balance = await this.orderService.getBalance(userId, asset);
            
            //  If no balance found, return 404
            if (!balance || (balance.available === 0 && balance.locked === 0)) {
                this.logger.log(LogLevel.WARN, `[OrderController] User not found or zero balance for userId: ${userId}, asset: ${asset}`);
                return new Response(
                    JSON.stringify({ error: 'User not found' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            this.logger.log(LogLevel.INFO, `[OrderController] Successfully retrieved balance for userId: ${userId}, asset: ${asset}`);
            return this.successResponse(balance);
            
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[OrderController] Error in getBalance: ${error.message}`);
            return this.errorResponse(error);
        }
    }

    // ─── Validators ────────────────────────────────────────────────

    private validateCreateOrder(dto: CreateOrderRequestDTO): void {
        if (!dto.userId) throw new Error('User ID is required');
        if (!dto.symbol) throw new Error('Symbol is required');
        if (dto.price <= 0) throw new Error('Price must be greater than 0');
        if (dto.quantity <= 0) throw new Error('Quantity must be greater than 0');
        if (dto.side !== 'buy' && dto.side !== 'sell') throw new Error('Side must be "buy" or "sell"');
    }

    // ─── Response Helpers ──────────────────────────────────────────

    private successResponse(data: any, status: number = 200): Response {
        return new Response(
            JSON.stringify(data),
            {
                status,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    private errorResponse(error: any, status?: number): Response {
        const message = error.message || error || 'Internal server error';
        // Use provided status or determine from message
        const statusCode = status || (message.includes('required') || message.includes('must be') ? 400 : 500);
        
        // ✅ Log the error response being sent to the client
        this.logger.log(statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN, `[OrderController] Sending error response: ${message} (Status: ${statusCode})`);

        return new Response(
            JSON.stringify({ error: message }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}