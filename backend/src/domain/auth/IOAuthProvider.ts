export interface OAuthUserProfile {
    providerUserId: string;
    email: string;
    username: string;
}

export interface OAuthTokenResponse {
    accessToken: string;
    tokenType: string;
}

export interface IOAuthProvider {
    readonly provider: string;
    getAuthorizationUrl(state: string): string;
    exchangeCode(code: string): Promise<OAuthTokenResponse>;
    fetchUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
