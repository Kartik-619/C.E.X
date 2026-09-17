import type { AuthService } from '../service/auth-service';
import type { OAuthProviderName } from '../../domain/auth/oauth-providers';
import { OAuthProviderFactory } from '../../infra/auth/oauth-provider.factory';
import { LoggerFactory } from '../../infra/logging/logger.factory';
import { LogLevel } from '../../infra/logging/log-level';
import { Logger } from '../../infra/logging/logger';

export class OAuthController {
    private readonly logger: Logger;
    private static oauthStates = new Map<string, number>();

    constructor(private authService: AuthService) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async initiate(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, '[OAuthController] Received OAuth initiate request');
        try {
            const url = new URL(request.url);
            const providerParam = url.searchParams.get('provider');
            const redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';

            if (!providerParam) {
                return this.errorResponse('Provider query parameter is required', 400);
            }

            const provider = providerParam as OAuthProviderName;
            const availableProviders = OAuthProviderFactory.getAvailableProviders();
            if (!availableProviders.includes(provider)) {
                return this.errorResponse(
                    `Unsupported provider: ${provider}. Available: ${availableProviders.join(', ')}`,
                    400,
                );
            }

            const state = crypto.randomUUID();
            OAuthController.oauthStates.set(state, Date.now());

            const oauthProvider = OAuthProviderFactory.create(provider);
            const authUrl = oauthProvider.getAuthorizationUrl(state);

            const params = new URLSearchParams({ provider, redirect: redirectUri });
            const callbackUrl = `${authUrl}&state=${state}_${params.toString()}`;

            return Response.json({ url: callbackUrl });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'OAuth initiation failed';
            this.logger.log(LogLevel.ERROR, `[OAuthController] ${message}`);
            return this.errorResponse(message, 500);
        }
    }

    async callback(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, '[OAuthController] Received OAuth callback');
        try {
            const url = new URL(request.url);
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');

            if (!code || !state) {
                return this.errorResponse('Missing authorization code or state', 400);
            }

            const underscoreIndex = state.indexOf('_');
            if (underscoreIndex === -1) {
                return this.errorResponse('Invalid state parameter', 400);
            }

            const stateKey = state.substring(0, underscoreIndex);
            const stateParams = new URLSearchParams(state.substring(underscoreIndex + 1));
            const provider = stateParams.get('provider') as OAuthProviderName;
            const redirect = stateParams.get('redirect') || process.env.FRONTEND_URL || 'http://localhost:3000';

            const storedState = OAuthController.oauthStates.get(stateKey);
            if (!storedState) {
                return this.errorResponse('Invalid or expired OAuth state', 400);
            }
            OAuthController.oauthStates.delete(stateKey);

            const age = Date.now() - storedState;
            if (age > 10 * 60 * 1000) {
                return this.errorResponse('OAuth state expired', 400);
            }

            const oauthProvider = OAuthProviderFactory.create(provider);
            const result = await this.authService.oauthLogin(oauthProvider, code);

            const redirectUrl = new URL(redirect);
            redirectUrl.pathname = '/auth/callback';
            redirectUrl.searchParams.set('token', result.token);

            return new Response(null, {
                status: 302,
                headers: { Location: redirectUrl.toString() },
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'OAuth callback failed';
            this.logger.log(LogLevel.ERROR, `[OAuthController] ${message}`);
            const redirect = process.env.FRONTEND_URL || 'http://localhost:3000';
            const errorUrl = new URL(redirect);
            errorUrl.pathname = '/auth/callback';
            errorUrl.searchParams.set('error', message);
            return new Response(null, {
                status: 302,
                headers: { Location: errorUrl.toString() },
            });
        }
    }

    async providers(_request: Request): Promise<Response> {
        const providers = OAuthProviderFactory.getAvailableProviders();
        return Response.json({ providers });
    }

    private errorResponse(message: string, status: number): Response {
        this.logger.log(
            status >= 500 ? LogLevel.ERROR : LogLevel.WARN,
            `[OAuthController] Sending error response: ${message} (Status: ${status})`,
        );
        return Response.json({ error: message }, { status });
    }
}
