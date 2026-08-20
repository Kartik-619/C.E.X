// OrderController.ts

import type { OrderService } from '../service/order-service';
import type { CreateOrderRequestDTO } from '../dto/requestorderDTO';

export class OrderController {
    constructor(private orderService: OrderService) { }

    async placeOrder(request: Request): Promise<Response> {
        try {
            // 1. Parse request
            const body = (await request.json()) as Record<string, any>;
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
            }

            // 2. Create DTO
            const dto: CreateOrderRequestDTO = {
                orderId:Date.now(),
                userId: body.userId,
                symbol: body.symbol,
                side: body.side,
                price: Number(body.price),    // ← Parse to number
                quantity: Number(body.quantity), // ← Parse to number
                type: body.type || 'LIMIT'
            };

            // 3. Basic validation (controller's job)
            this.validateRequest(dto);

            // 4. Call service
            const result = await this.orderService.placeOrder(dto);

            // 5. Return response
            return this.successResponse(result, 201);

        } catch (error) {
            return this.errorResponse(error);
        }
    }

    async addOrder(request: Request): Promise<Response> {
        try {
            const body = (await request.json()) as Record<string, any>;
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
            }

            // 2. Create DTO
            const dto: CreateOrderRequestDTO = {
                orderId:body.orderId,
                userId: body.userId,
                symbol: body.symbol,
                side: body.side,
                price: Number(body.price),    // ← Parse to number
                quantity: Number(body.quantity), // ← Parse to number
                type: body.type || 'LIMIT'
            };

            // 3. Basic validation (controller's job)
            this.validateRequest(dto);
            await this.orderService.addOrder(dto);
            return this.successResponse("Order added successfully", 201);
        } catch (e) {
            return this.errorResponse(`Internal Error while adding the order: ${e}`)
        }
    }

    async cancelOrder(request: Request): Promise<Response> {
        try {
            const body = (await request.json()) as Record<string, any>;
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
            }

            // 2. Create DTO
            const dto: CreateOrderRequestDTO = {
                orderId:body.orderId,
                userId: body.userId,
                symbol: body.symbol,
                side: body.side,
                price: Number(body.price),    // ← Parse to number
                quantity: Number(body.quantity), // ← Parse to number
                type: body.type || 'LIMIT'
            };

            // 3. Basic validation (controller's job)
            this.validateRequest(dto);
            if(!dto.userId){
                throw new Error("UserID invalid")
            }
            await this.orderService.cancelOrder(dto.orderId,dto.userId);
            return this.successResponse("Order deleted successfully", 201);
        } catch (e) {
            return this.errorResponse(`Internal Error while deleting the order: ${e}`)
        }
    }

    private validateRequest(dto: CreateOrderRequestDTO): void {
        if (!dto.userId) {
            throw new Error('User ID is required');
        }
        if (!dto.symbol) {
            throw new Error('Symbol is required');
        }
        if (dto.price <= 0) {
            throw new Error('Price must be greater than 0');
        }
        if (dto.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (dto.side !== 'buy' && dto.side !== 'sell') {
            throw new Error('Side must be "buy" or "sell"');
        }
    }

    private successResponse(data: any, status: number = 200): Response {
        return new Response(
            JSON.stringify(data),
            {
                status,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    private errorResponse(error: any): Response {
        const status = error.message.includes('required') ? 400 : 500;
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal server error'
            }),
            {
                status,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}