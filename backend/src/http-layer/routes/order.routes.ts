// src/api/routes/order.routes.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { OrderController } from '../controllers/order-controller';

export class OrderRoutes implements RouteModule {
    constructor(private orderController: OrderController) {}

    register(router: AppRouter): void {
        // ✅ POST /api/orders - Place order
        router.post('/api/orders', (req: Request) => 
            this.orderController.placeOrder(req)
        );

        // ✅ POST /api/orders/add - Add to book (optional)
        router.post('/api/orders/add', (req: Request) => 
            this.orderController.addOrder(req)
        );

        // ✅ DELETE /api/orders - Cancel order
        router.delete('/api/orders', (req: Request) => 
            this.orderController.cancelOrder(req)
        );

        // ✅ GET /api/balance/:userId - Get balance
        router.get('/api/balance/:userId', (req: Request) => 
            this.orderController.getBalance(req)
        );
    }
}