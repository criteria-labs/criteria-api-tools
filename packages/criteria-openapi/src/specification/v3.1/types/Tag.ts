import { ExternalDocumentation } from './ExternalDocumentation'

export interface Tag {
  name: string
  description?: string
  externalDocs?: ExternalDocumentation

  [key: `x-${string}`]: any
}
