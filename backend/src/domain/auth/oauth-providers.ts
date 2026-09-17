export type OAuthProviderName = 'google' | 'github';

export interface OAuthProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scope: string;
}

export function getOAuthConfig(provider: OAuthProviderName): OAuthProviderConfig {
    const baseRedirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3010/api/auth/oauth/callback';

    switch (provider) {
        case 'google':
            return {
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirectUri: baseRedirectUri,
                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
                scope: 'openid email profile',
            };
        case 'github':
            return {
                clientId: process.env.GITHUB_CLIENT_ID || '',
                clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
                redirectUri: baseRedirectUri,
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                userInfoUrl: 'https://api.github.com/user',
                scope: 'read:user user:email',
            };
        default:
            throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
}
