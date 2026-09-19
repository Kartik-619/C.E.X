// src/http-layer/routes/trade.routes.ts

import type { AppRouter, RouteModule } from './route.interface';
import type { TradeController } from '../controllers/trade-controller';

export class TradeRoutes implements RouteModule {
    constructor(private tradeController: TradeController) {}

    register(router: AppRouter): void {
        router.get('/api/trades', (req: Request) =>
            this.tradeController.getRecentTrades(req)
        );

        router.get('/api/trades/me', (req: Request) =>
            this.tradeController.getUserTrades(req)
        );

        router.get('/api/ticks', (req: Request) =>
            this.tradeController.getTicks(req)
        );
    }
}