// TradeController.ts

import type { TradeService } from '../service/trade-service';
import type { AuthContext } from '../middleware/auth-middleware';

import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";
import { Logger } from "../../infra/logging/logger";

export class TradeController {
    private readonly logger: Logger;

    constructor(private tradeService: TradeService) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    // Public: recent market trades for a symbol
    async getRecentTrades(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[TradeController] Received getRecentTrades request`);
        try {
            const url = new URL(request.url);
            const symbol = url.searchParams.get('symbol') ?? undefined;
            const limit = this.parseLimit(url.searchParams.get('limit'));

            const trades = await this.tradeService.getRecentTrades(symbol, limit);
            return this.successResponse(trades);
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[TradeController] Error in getRecentTrades: ${error.message}`);
            return this.errorResponse(error);
        }
    }

    // Public: recent tick stream for a symbol
    async getTicks(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[TradeController] Received getTicks request`);
        try {
            const url = new URL(request.url);
            const symbol = url.searchParams.get('symbol') ?? undefined;
            const limit = this.parseLimit(url.searchParams.get('limit'));

            const ticks = await this.tradeService.getTicks(symbol, limit);
            return this.successResponse(ticks);
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[TradeController] Error in getTicks: ${error.message}`);
            return this.errorResponse(error);
        }
    }

    // Auth-scoped: trades involving the current user
    async getUserTrades(request: Request, auth?: AuthContext): Promise<Response> {
        this.logger.log(LogLevel.INFO, `[TradeController] Received getUserTrades request`);
        try {
            const userId = auth?.user.id;

            if (!userId) {
                this.logger.log(LogLevel.WARN, `[TradeController] Missing userId in getUserTrades request`);
                return this.errorResponse('User ID is required', 400);
            }

            const url = new URL(request.url);
            const limit = this.parseLimit(url.searchParams.get('limit'));

            const trades = await this.tradeService.getUserTrades(userId, limit);
            return this.successResponse(trades);
        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[TradeController] Error in getUserTrades: ${error.message}`);
            return this.errorResponse(error);
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private parseLimit(raw: string | null): number | undefined {
        if (raw === null || raw.trim() === '') return undefined;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    private successResponse(data: unknown): Response {
        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    private errorResponse(error: any, status?: number): Response {
        const message = error?.message || error || 'Internal server error';
        const statusCode = status || (
            message.includes('required') ||
            message.includes('must be') ||
            message.includes('Invalid')
            ? 400
            : 500
        );

        this.logger.log(statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN, `[TradeController] Sending error response: ${message} (Status: ${statusCode})`);

        return new Response(
            JSON.stringify({ error: message }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}