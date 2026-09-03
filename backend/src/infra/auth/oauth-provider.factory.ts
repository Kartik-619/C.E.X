import type { IOAuthProvider } from '../../domain/auth/IOAuthProvider';
import type { OAuthProviderName } from '../../domain/auth/oauth-providers';
import { GoogleOAuthProvider } from './oauth-google';
import { GithubOAuthProvider } from './oauth-github';

export class OAuthProviderFactory {
    private static createProvider(providerName: OAuthProviderName): IOAuthProvider {
        switch (providerName) {
            case 'google':
                return new GoogleOAuthProvider();
            case 'github':
                return new GithubOAuthProvider();
            default:
                throw new Error(`OAuth provider not supported: ${providerName}`);
        }
    }

    static create(providerName: OAuthProviderName): IOAuthProvider {
        return this.createProvider(providerName);
    }

    static getAvailableProviders(): OAuthProviderName[] {
        const enabled = process.env.OAUTH_PROVIDER;
        if (enabled) {
            const providers = enabled.split(',')
                .map((p) => p.trim().toLowerCase())
                .filter((p): p is OAuthProviderName => p === 'google' || p === 'github');
            return Array.from(new Set(providers));
        }

        const allProviders: OAuthProviderName[] = ['google', 'github'];
        return allProviders.filter((p) => {
            const envKey = p.toUpperCase() + '_CLIENT_ID';
            return process.env[envKey] && process.env[envKey] !== '';
        });
    }
}
