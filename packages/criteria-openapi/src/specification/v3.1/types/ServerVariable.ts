export interface ServerVariable {
  enum?: string[]
  default: string
  description?: string

  [key: `x-${string}`]: any
}
