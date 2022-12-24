export interface License {
  name: string
  url?: string

  [key: `x-${string}`]: any
}
