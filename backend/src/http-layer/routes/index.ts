// src/api/routes/index.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { OrderController } from '../controllers/order-controller';
import type { AuthController } from '../controllers/auth-controller';
import type { OAuthController } from '../controllers/oauth-controller';
import { HealthRoutes } from './health.routes';
import { OrderRoutes } from './order.routes';
import { AuthRoutes } from './auth.routes';

export class Routes {
    private modules: RouteModule[];

    constructor(orderController: OrderController, authController: AuthController, oauthController: OAuthController) {
        this.modules = [
            new HealthRoutes(),
            new AuthRoutes(authController, oauthController),
            new OrderRoutes(orderController),
        ];
    }

    register(router: AppRouter): void {
        for (const module of this.modules) {
            module.register(router);
        }

        // Global fallback 404
        if (router.all) {
            router.all('*', () => Response.json(
                { error: 'Route not found' },
                { status: 404 }
            ));
        }
    }
}