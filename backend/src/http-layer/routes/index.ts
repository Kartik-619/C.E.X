// src/api/routes/index.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { OrderController } from '../controllers/order-controller';
import { OrderRoutes } from './order.routes';
import { HealthRoutes } from './health.routes';

export class Routes {
    private modules: RouteModule[];

    constructor(orderController: OrderController) {
        this.modules = [
            new HealthRoutes(),
            new OrderRoutes(orderController),
            // Add new feature routes here (e.g., new UserRoutes(userController))
        ];
    }

    register(router: AppRouter): void {
        // Register all sub-routers
        for (const module of this.modules) {
            module.register(router);
        }

        // Global fallback 404
        if (router.all) {
            router.all('*', () => Response.json({ error: 'Route not found' }, { status: 404 }));
        }
    }
}