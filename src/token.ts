
export interface TokenProvider{
    getJWTAccessToken():Promise<string>
}