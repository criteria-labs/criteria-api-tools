export interface XML {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean

  [key: `x-${string}`]: any
}
