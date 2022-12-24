export interface Contact {
  name?: string
  url?: string
  email?: string

  [key: `x-${string}`]: any
}
