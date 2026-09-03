// src/http-layer/routes/auth.routes.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { AuthController } from '../controllers/auth-controller';
import type { OAuthController } from '../controllers/oauth-controller';

export class AuthRoutes implements RouteModule {
    constructor(
        private authController: AuthController,
        private oauthController: OAuthController,
    ) {}

    register(router: AppRouter): void {
        router.post('/api/auth/register', (req: Request) =>
            this.authController.register(req)
        );

        router.post('/api/auth/login', (req: Request) =>
            this.authController.login(req)
        );

        router.get('/api/auth/oauth', (req: Request) =>
            this.oauthController.initiate(req)
        );

        router.get('/api/auth/oauth/callback', (req: Request) =>
            this.oauthController.callback(req)
        );

        router.get('/api/auth/oauth/providers', (req: Request) =>
            this.oauthController.providers(req)
        );
    }
}
