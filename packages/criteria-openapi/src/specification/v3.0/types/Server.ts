import { ServerVariable } from './ServerVariable'

export interface Server {
  url: string
  description?: string
  variables?: { [variableName: string]: ServerVariable }

  [key: `x-${string}`]: any
}
