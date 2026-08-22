// OrderController.ts

import type { OrderService } from '../service/order-service';
import type { CreateOrderRequestDTO, CancelOrderRequestDTO } from '../dto/requestorderDTO';

export class OrderController {
    constructor(private orderService: OrderService) { }

    // 1. Active order - match immediately
    async placeOrder(request: Request): Promise<Response> {
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
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
            return this.successResponse(result, 201);

        } catch (error) {
            return this.errorResponse(error);
        }
    }

    // 2. Passive order - just add to book (no matching)
    async addOrder(request: Request): Promise<Response> {
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
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
            return this.successResponse({ message: 'Order added successfully' }, 201);
            
        } catch (error) {
            return this.errorResponse(error);
        }
    }

    // 3. Cancel order
    async cancelOrder(request: Request): Promise<Response> {
        try {
            const body = await request.json() as Record<string, any>;
            
            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body');
            }

            if (!body.orderId) {
                return this.errorResponse('Order ID is required');
            }
            if (!body.userId) {
                return this.errorResponse('User ID is required');
            }

            const dto: CancelOrderRequestDTO = {
                orderId: Number(body.orderId),
                userId: body.userId
            };

            await this.orderService.cancelOrder(dto.orderId, dto.userId);
            return this.successResponse({ message: 'Order cancelled successfully' }, 200);
            
        } catch (error) {
            return this.errorResponse(error);
        }
    }

    // 4. Get balance
   // In OrderController.ts - getBalance()
// In OrderController.ts - getBalance()
async getBalance(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const userId = url.pathname.split('/').pop();
        const asset = url.searchParams.get('asset') || 'USD';

        if (!userId) {
            return this.errorResponse('User ID is required');
        }

        const balance = await this.orderService.getBalance(userId, asset);
        
        // ✅ If no balance found, return 404
        if (!balance || (balance.available === 0 && balance.locked === 0)) {
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return this.successResponse(balance);
        
    } catch (error) {
        return this.errorResponse(error);
    }
}
    // ─── Validators ────────────────────────────────────────────────

    private validateCreateOrder(dto: CreateOrderRequestDTO): void {
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

 // In OrderController.ts

private errorResponse(error: any, status?: number): Response {
    const message = error.message || error || 'Internal server error';
    // Use provided status or determine from message
    const statusCode = status || 
                       (message.includes('required') || message.includes('must be') ? 400 : 500);
    
    return new Response(
        JSON.stringify({ error: message }),
        {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
}