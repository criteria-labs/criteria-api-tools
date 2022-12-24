export interface Example {
  summary?: string
  description?: string
  value?: any
  externalValue?: string

  [key: `x-${string}`]: any
}
