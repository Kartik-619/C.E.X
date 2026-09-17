import type { IOAuthProvider, OAuthUserProfile, OAuthTokenResponse } from '../../domain/auth/IOAuthProvider';
import { getOAuthConfig } from '../../domain/auth/oauth-providers';

export class GoogleOAuthProvider implements IOAuthProvider {
    readonly provider = 'google';
    private config = getOAuthConfig('google');

    getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scope,
            state,
            access_type: 'offline',
            prompt: 'consent',
        });
        return `${this.config.authorizationUrl}?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<OAuthTokenResponse> {
        const response = await fetch(this.config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange OAuth code with Google');
        }

        const data = await response.json() as Record<string, string | undefined>;
        return {
            accessToken: data.access_token ?? '',
            tokenType: data.token_type ?? '',
        };
    }

    async fetchUserProfile(accessToken: string): Promise<OAuthUserProfile> {
        const response = await fetch(this.config.userInfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile from Google');
        }

        const data = await response.json() as Record<string, string | undefined>;
        const email = data.email ?? '';
        const name = data.name ?? '';
        const fallbackUsername = email.split('@')[0] ?? 'user';
        return {
            providerUserId: data.id ?? '',
            email,
            username: name || fallbackUsername,
        };
    }
}
