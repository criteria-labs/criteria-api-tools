export interface License {
  name: string
  identifier?: string
  url?: string

  [key: `x-${string}`]: any
}
