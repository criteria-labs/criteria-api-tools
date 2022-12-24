import { JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Reference } from './Reference'
import { XML } from './XML'

export type Schema<ReferenceType = Reference | never> = Omit<JSONSchemaDraft2020_12, 'description' | 'format'> & {
  description?: string
  format?: string
} & {
  discriminator?: Discriminator
  xml?: XML
  externalDocs?: ExternalDocumentation
  example?: any

  [key: `x-${string}`]: any
}
