import { Server } from './Server'

export interface Link {
  operationRef?: string
  operationId?: string
  parameters?: { [key: string]: any | string }
  requestBody?: any | string
  description?: string
  server?: Server

  [key: `x-${string}`]: any
}
