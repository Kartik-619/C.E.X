// src/http-layer/routes/auth.routes.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { AuthController } from '../controllers/auth-controller';

export class AuthRoutes implements RouteModule {
    constructor(private authController: AuthController) {}

    register(router: AppRouter): void {
        router.post('/api/auth/register', (req: Request) =>
            this.authController.register(req)
        );

        router.post('/api/auth/login', (req: Request) =>
            this.authController.login(req)
        );
    }
}
