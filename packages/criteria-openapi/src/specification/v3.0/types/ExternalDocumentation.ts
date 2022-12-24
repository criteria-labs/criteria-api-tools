export interface ExternalDocumentation {
  description?: string
  url: string

  [key: `x-${string}`]: any
}
