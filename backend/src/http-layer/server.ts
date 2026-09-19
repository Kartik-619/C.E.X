// src/api/server.ts

import { serve } from 'bun';
import { StandardEngine } from '../domain/engine/services/Engine';
import { OrderBook } from '../domain/engine/services/orderBook/orderBook';
import { Wallet } from '../domain/engine/services/wallet/wallet';

// In-memory stores
import { inmemory_OrderBookStore } from '../infra/store/orderbook-store';
import { Inmemory_WalletStore } from '../infra/store/wallet-store';
import { Inmemory_User } from '../infra/store/inmemory-user.store';

// Database stores
import { DbOrderBookStore } from '../infra/store/db-orderbook.store';
import { DbWalletStore } from '../infra/store/db-wallet.store';
import { DbUserStore } from '../infra/store/db-user.store';
import { DbTradeStore } from '../infra/store/db-trade.store';
import { Inmemory_TradeStore } from '../infra/store/trade-store';
import { migrate } from '../infra/db/schema';
import { closePool } from '../infra/db/connection';

import { OrderService } from './service/order-service';
import { TradeService } from './service/trade-service';
import { AuthService } from './service/auth-service';
import { EmailService } from './service/email-service';
import { EmailJSProvider } from './service/emailjs.provider';
import { OtpService } from './service/otp-service';
import { OrderController } from './controllers/order-controller';
import { TradeController } from './controllers/trade-controller';
import { AuthController } from './controllers/auth-controller';
import { OAuthController } from './controllers/oauth-controller';
import { OTPController } from './controllers/otp-controller';
import { AuthMiddleware } from './middleware/auth-middleware';
import { Routes } from './routes/index';
import type { AppRouter } from './routes/route.interface';
import { seedDatabase } from '../tests/seed/seed';
import { EventManager } from '../domain/events/event-bus';
import { WebsocketServer } from '../infra/ws/ws-server';
import { WebSocketBroadcaster } from '../domain/events/ws-broadcast.orderbook';
import { LoggerFactory } from '../infra/logging/logger.factory';
import { LogLevel } from '../infra/logging/log-level';
import { OTPService } from '../infra/auth/otp';
import { JwtTokenVerifier } from '../infra/auth/jwt';

const USE_DB = process.env.USE_DB === 'true';

// 1. Create Logger
const logger = LoggerFactory.createLogger('console', LogLevel.INFO);

// 2. Infrastructure Layer — select store backend
let orderBookStore: inmemory_OrderBookStore | DbOrderBookStore;
let walletStore: Inmemory_WalletStore | DbWalletStore;
let userStore: Inmemory_User | DbUserStore;
let tradeStore: Inmemory_TradeStore | DbTradeStore;

if (USE_DB) {
    logger.log(LogLevel.INFO, '[Server] Using PostgreSQL stores');
    await migrate();
    orderBookStore = new DbOrderBookStore();
    walletStore = new DbWalletStore();
    userStore = new DbUserStore();
    tradeStore = new DbTradeStore();
} else {
    logger.log(LogLevel.INFO, '[Server] Using in-memory stores');
    orderBookStore = new inmemory_OrderBookStore(logger);
    walletStore = new Inmemory_WalletStore();
    userStore = new Inmemory_User();
    tradeStore = new Inmemory_TradeStore();
}

const orderBook = new OrderBook(orderBookStore, logger);
const wallet = new Wallet(walletStore);
const bus = new EventManager(logger);

// 3. Create WebSocket Server
const wsServer = new WebsocketServer(3011, logger, new JwtTokenVerifier());
wsServer.start();

// 4. Create WebSocket Broadcaster (connects EventBus → WebSocket)
const wsBroadcaster = new WebSocketBroadcaster(bus, wsServer, logger);

// 5. Create Engine with EventBus
const engine = new StandardEngine(orderBook, wallet, bus, tradeStore);

// 6. Service Layer
const orderService = new OrderService(engine);
const tradeService = new TradeService(tradeStore);
const authService = new AuthService(userStore, walletStore);

// 7. Email / OTP services
const emailProvider = new EmailJSProvider({
    serviceId: process.env.EMAIL_SERVICE_ID ?? '',
    templateId: process.env.EMAIL_TEMPLATE_ID ?? '',
    publicKey: process.env.EMAIL_PUBLIC_KEY ?? '',
    privateKey: process.env.EMAIL_SERVICE_KEY,
});
const infraOtpService = new OTPService(logger);
const emailService = new EmailService(
    emailProvider,
    infraOtpService,
    { fromName: process.env.EMAIL_FROM_NAME ?? 'CEX Support' },
    logger,
);
const otpService = new OtpService(userStore, emailService);

// 8. Controller Layer
const orderController = new OrderController(orderService);
const tradeController = new TradeController(tradeService);
const authController = new AuthController(authService);
const oauthController = new OAuthController(authService);
const otpController = new OTPController(otpService);

// 9. Middleware
const authMiddleware = new AuthMiddleware(authService);

// 10. Routes
const routes = new Routes(orderController, authController, oauthController, otpController, tradeController);

// 11. Create router adapter
const router: AppRouter = {
    get: (path, handler) => {
        logger.log(LogLevel.INFO, `[Router] Registered GET ${path}`);
    },
    post: (path, handler) => {
        logger.log(LogLevel.INFO, `[Router] Registered POST ${path}`);
    },
    delete: (path, handler) => {
        logger.log(LogLevel.INFO, `[Router] Registered DELETE ${path}`);
    },
};

// 12. Register routes
routes.register(router);

// 13. Seed the database with test users
await seedDatabase(walletStore, tradeStore, logger);

// 14. Protected route handler wrapper
const requireAuth = authMiddleware.createHandler.bind(authMiddleware);

// 15. Server with manual routing
const server = serve({
    port: 3010,
    async fetch(request: Request) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;

        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        const withCorsHeaders = (response: Response): Response => {
            const responseHeaders = new Headers(response.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders,
            });
        };

        try {
            let response: Response;

            if (path === '/api/health' && method === 'GET') {
                response = new Response(
                    JSON.stringify({ status: 'healthy', storage: USE_DB ? 'postgresql' : 'in-memory' }),
                    { status: 200, headers }
                );
            } else if (path === '/api/auth/register' && method === 'POST') {
                response = await authController.register(request);
            } else if (path === '/api/auth/login' && method === 'POST') {
                response = await authController.login(request);
            } else if (path === '/api/auth/otp/request' && method === 'POST') {
                response = await otpController.requestOtp(request);
            } else if (path === '/api/auth/otp/verify' && method === 'POST') {
                response = await otpController.verifyOtp(request);
            } else if (path === '/api/auth/oauth' && method === 'GET') {
                response = await oauthController.initiate(request);
            } else if (path === '/api/auth/oauth/callback' && method === 'GET') {
                response = await oauthController.callback(request);
            } else if (path === '/api/auth/oauth/providers' && method === 'GET') {
                response = await oauthController.providers(request);
            } else if (path === '/api/orderbook' && method === 'GET') {
                response = await orderController.getOrderBook(request);
            } else if (path === '/api/trades' && method === 'GET') {
                response = await tradeController.getRecentTrades(request);
            } else if (path === '/api/trades/me' && method === 'GET') {
                response = await requireAuth((req, auth) => tradeController.getUserTrades(req, auth))(request);
            } else if (path === '/api/ticks' && method === 'GET') {
                response = await tradeController.getTicks(request);
            } else if (path === '/api/orders' && method === 'GET') {
                response = await requireAuth((req, auth) => orderController.getUserOrders(req, auth))(request);
            } else if (path === '/api/orders' && method === 'POST') {
                response = await requireAuth((req) => orderController.placeOrder(req))(request);
            } else if (path === '/api/orders/add' && method === 'POST') {
                response = await requireAuth((req) => orderController.addOrder(req))(request);
            } else if (path === '/api/orders' && method === 'DELETE') {
                response = await requireAuth((req) => orderController.cancelOrder(req))(request);
            } else if (path.startsWith('/api/balance/') && method === 'GET') {
                response = await requireAuth((req) => orderController.getBalance(req))(request);
            } else if (path === '/api/balance/deposit' && method === 'POST') {
                response = await requireAuth((req, auth) => orderController.deposit(req, auth))(request);
            } else {
                response = new Response(
                    JSON.stringify({ error: `Route ${method} ${path} not found` }),
                    { status: 404, headers }
                );
            }

            return withCorsHeaders(response);

        } catch (error: any) {
            return new Response(
                JSON.stringify({
                    error: 'Internal server error',
                    message: error.message
                }),
                { status: 500, headers }
            );
        }
    }
});

logger.log(LogLevel.INFO, `Server running on http://localhost:${server.port}`);
logger.log(LogLevel.INFO, `Storage: ${USE_DB ? 'PostgreSQL' : 'In-Memory'}`);
logger.log(LogLevel.INFO, `Endpoints:`);
logger.log(LogLevel.INFO, `   POST   /api/auth/register          - Register a new user`);
logger.log(LogLevel.INFO, `   POST   /api/auth/login             - Login`);
logger.log(LogLevel.INFO, `   POST   /api/auth/otp/request      - Request OTP via email`);
logger.log(LogLevel.INFO, `   POST   /api/auth/otp/verify        - Verify OTP`);
logger.log(LogLevel.INFO, `   GET    /api/auth/oauth              - Initiate OAuth flow`);
logger.log(LogLevel.INFO, `   GET    /api/auth/oauth/callback     - OAuth callback`);
logger.log(LogLevel.INFO, `   GET    /api/auth/oauth/providers    - List configured OAuth providers`);
logger.log(LogLevel.INFO, `   POST   /api/orders                 - Place an order (auth)`);
logger.log(LogLevel.INFO, `   GET    /api/orders                  - List user's open orders (auth)`);
logger.log(LogLevel.INFO, `   POST   /api/orders/add             - Add order to book (auth)`);
logger.log(LogLevel.INFO, `   DELETE /api/orders                  - Cancel an order (auth)`);
logger.log(LogLevel.INFO, `   GET    /api/balance/:userId         - Get balance (auth)`);
logger.log(LogLevel.INFO, `   POST   /api/balance/deposit        - Deposit funds (auth)`);
logger.log(LogLevel.INFO, `   GET    /api/orderbook               - Get order book`);
logger.log(LogLevel.INFO, `   GET    /api/trades                  - Recent market trades`);
logger.log(LogLevel.INFO, `   GET    /api/trades/me               - Current user's trades (auth)`);
logger.log(LogLevel.INFO, `   GET    /api/ticks                   - Recent price ticks`);
logger.log(LogLevel.INFO, `   GET    /api/health                  - Health check`);
logger.log(LogLevel.INFO, `WebSocket running on ws://localhost:3011`);

// Graceful shutdown
const shutdown = async () => {
    logger.log(LogLevel.INFO, 'Shutting down...');
    wsServer.stop();
    server.stop();
    if (USE_DB) {
        await closePool();
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
