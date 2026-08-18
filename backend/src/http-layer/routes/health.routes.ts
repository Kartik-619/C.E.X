// src/api/routes/health.routes.ts

import type { AppRouter, RouteModule } from './route.interface';

export class HealthRoutes implements RouteModule {
    register(router: AppRouter): void {
        router.get('/api/health', () => {
            return Response.json(
                { status: 'healthy', timestamp: new Date().toISOString() },
                { status: 200 }
            );
        });
    }
}