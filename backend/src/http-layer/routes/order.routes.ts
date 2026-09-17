// src/api/routes/order.routes.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { OrderController } from '../controllers/order-controller';

export class OrderRoutes implements RouteModule {
    constructor(private orderController: OrderController) {}

    register(router: AppRouter): void {
        router.post('/api/orders', (req: Request) => 
            this.orderController.placeOrder(req)
        );

        router.post('/api/orders/add', (req: Request) => 
            this.orderController.addOrder(req)
        );

        router.delete('/api/orders', (req: Request) => 
            this.orderController.cancelOrder(req)
        );

        router.get('/api/balance/:userId', (req: Request) => 
            this.orderController.getBalance(req)
        );

        router.post('/api/balance/deposit', (req: Request) => 
            this.orderController.getBalance(req)
        );

        
        router.get('/api/orderbook', (req: Request) => 
            this.orderController.getOrderBook(req)
        );
    }
}