import { OAuthFlows } from './OAuthFlows'

export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPSecurityScheme
  | OAuth2SecurityScheme
  | OpenIDConnectSecurityScheme

export interface APIKeySecurityScheme {
  type: 'apiKey'
  description?: string
  name: string
  in: 'query' | 'header' | 'cookie'

  [key: `x-${string}`]: any
}

export interface HTTPSecurityScheme {
  type: 'http'
  description?: string
  scheme: string
  bearerFormat?: string

  [key: `x-${string}`]: any
}

export interface OAuth2SecurityScheme {
  type: 'oauth2'
  description?: string
  flows: OAuthFlows

  [key: `x-${string}`]: any
}

export interface OpenIDConnectSecurityScheme {
  type: 'openIdConnect'
  description?: string
  openIdConnectUrl: string

  [key: `x-${string}`]: any
}
