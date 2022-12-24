import { OAuthFlow } from './OAuthFlow'

export interface OAuthFlows {
  implicit?: OAuthFlow
  password?: OAuthFlow
  clientCredentials?: OAuthFlow
  authorizationCode?: OAuthFlow

  [key: `x-${string}`]: any
}
