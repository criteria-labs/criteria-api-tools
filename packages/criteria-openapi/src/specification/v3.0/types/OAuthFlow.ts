export type OAuthFlow = ImplicitOAuthFlow | PasswordOAuthFlow | ClientCredentialsOAuthFlow | AuthorizationCodeOAuthFlow

export interface ImplicitOAuthFlow {
  authorizationUrl: string
  refreshUrl?: string
  scopes: { [key: string]: string }

  [key: `x-${string}`]: any
}

export interface PasswordOAuthFlow {
  tokenUrl: string
  refreshUrl?: string
  scopes: { [key: string]: string }

  [key: `x-${string}`]: any
}

export interface ClientCredentialsOAuthFlow {
  tokenUrl: string
  refreshUrl?: string
  scopes: { [key: string]: string }

  [key: `x-${string}`]: any
}

export interface AuthorizationCodeOAuthFlow {
  authorizationUrl: string
  tokenUrl: string
  refreshUrl?: string
  scopes: { [key: string]: string }

  [key: `x-${string}`]: any
}
