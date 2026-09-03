import type { IOAuthProvider, OAuthUserProfile, OAuthTokenResponse } from '../../domain/auth/IOAuthProvider';
import { getOAuthConfig } from '../../domain/auth/oauth-providers';

export class GithubOAuthProvider implements IOAuthProvider {
    readonly provider = 'github';
    private config = getOAuthConfig('github');

    getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scope,
            state,
        });
        return `${this.config.authorizationUrl}?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<OAuthTokenResponse> {
        const response = await fetch(this.config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: new URLSearchParams({
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange OAuth code with GitHub');
        }

        const data = await response.json() as Record<string, string | undefined>;
        return {
            accessToken: data.access_token ?? '',
            tokenType: data.token_type ?? '',
        };
    }

    async fetchUserProfile(accessToken: string): Promise<OAuthUserProfile> {
        const userResponse = await fetch(this.config.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json',
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user profile from GitHub');
        }

        const userData = await userResponse.json() as Record<string, unknown>;

        let email = userData.email as string | null;
        if (!email) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github+json',
                },
            });
            if (emailsResponse.ok) {
                const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean }>;
                const primary = emails.find((e) => e.primary);
                email = primary?.email ?? emails[0]?.email ?? '';
            }
        }

        return {
            providerUserId: String(userData.id),
            email: email || '',
            username: (userData.login as string) || email?.split('@')[0] || 'user',
        };
    }
}
