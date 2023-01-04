import { JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Reference } from './Reference'
import { XML } from './XML'

export type Schema<ReferenceType = Reference | never> = JSONSchemaDraft2020_12 & {
  discriminator?: Discriminator
  xml?: XML
  externalDocs?: ExternalDocumentation
  example?: any

  [key: `x-${string}`]: any
}
