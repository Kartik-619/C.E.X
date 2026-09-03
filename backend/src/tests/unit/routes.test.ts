// src/api/__tests__/unit/routes.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Routes } from '../../http-layer/routes/index';
import { OrderRoutes } from '../../http-layer/routes/order.routes';
import { HealthRoutes } from '../../http-layer/routes/health.routes';
import { AuthRoutes } from '../../http-layer/routes/auth.routes';
import type { AppRouter } from '../../http-layer/routes/route.interface';
import type { OrderController } from '../../http-layer/controllers/order-controller';
import type { AuthController } from '../../http-layer/controllers/auth-controller';
import type { OAuthController } from '../../http-layer/controllers/oauth-controller';

describe('Routes', () => {
    let mockOrderController: OrderController;
    let mockAuthController: AuthController;
    let mockOAuthController: OAuthController;
    let routes: Routes;
    let mockRouter: AppRouter;

    beforeEach(() => {
        mockOrderController = {} as OrderController;
        mockAuthController = {} as AuthController;
        mockOAuthController = {} as OAuthController;
        routes = new Routes(mockOrderController, mockAuthController, mockOAuthController);
        mockRouter = {
            get: mock(() => {}),
            post: mock(() => {}),
            delete: mock(() => {}),
            all: mock(() => {})
        };
    });

    describe('register', () => {
        it('should register all route modules', () => {
            routes.register(mockRouter);

            expect(mockRouter.post).toHaveBeenCalled();
            expect(mockRouter.get).toHaveBeenCalled();
            expect(mockRouter.delete).toHaveBeenCalled();
        });

        it('should register health routes', () => {
            routes.register(mockRouter);

            expect(mockRouter.get).toHaveBeenCalledWith(
                '/api/health',
                expect.any(Function)
            );
        });

        it('should register auth routes', () => {
            routes.register(mockRouter);

            expect(mockRouter.post).toHaveBeenCalledWith(
                '/api/auth/register',
                expect.any(Function)
            );
            expect(mockRouter.post).toHaveBeenCalledWith(
                '/api/auth/login',
                expect.any(Function)
            );
        });

        it('should register order routes', () => {
            routes.register(mockRouter);

            expect(mockRouter.post).toHaveBeenCalledWith(
                '/api/orders',
                expect.any(Function)
            );
            expect(mockRouter.delete).toHaveBeenCalledWith(
                '/api/orders',
                expect.any(Function)
            );
        });

        it('should register 404 fallback', () => {
            routes.register(mockRouter);

            expect(mockRouter.all).toHaveBeenCalledWith(
                '*',
                expect.any(Function)
            );
        });
    });
});