// src/api/routes/order.routes.ts

import type { OrderController } from '../controllers/order-controller';
import type { AppRouter, RouteModule } from './route.interface';

export class OrderRoutes implements RouteModule {
    constructor(private orderController: OrderController) {}

    register(router: AppRouter): void {
        router.post('/api/orders', (req) => this.orderController.placeOrder(req));
        router.delete('/api/orders', (req) => this.orderController.cancelOrder(req));
    }
}