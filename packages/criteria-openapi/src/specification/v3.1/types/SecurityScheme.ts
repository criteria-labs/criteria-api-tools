import { OAuthFlows } from './OAuthFlows'

export type SecurityScheme = (
  | APIKeySecurityScheme
  | HTTPSecurityScheme
  | OAuth2SecurityScheme
  | OpenIDConnectSecurityScheme
) & {
  [key: `x-${string}`]: any
}

export interface APIKeySecurityScheme {
  type: 'apiKey'
  description?: string
  name: string
  in: 'query' | 'header' | 'cookie'
}

export interface HTTPSecurityScheme {
  type: 'http'
  description?: string
  scheme: string
  bearerFormat?: string
}

export interface OAuth2SecurityScheme {
  type: 'oauth2'
  description?: string
  flows: OAuthFlows
}

export interface OpenIDConnectSecurityScheme {
  type: 'openIdConnect'
  description?: string
  openIdConnectUrl: string
}
