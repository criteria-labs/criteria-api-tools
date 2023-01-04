import { JSONSchema } from '@criteria/json-schema/draft-2020-12'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Reference } from './Reference'
import { XML } from './XML'

export type Schema<ReferenceType = Reference | never> = JSONSchema & {
  discriminator?: Discriminator
  xml?: XML
  externalDocs?: ExternalDocumentation
  example?: any

  [key: `x-${string}`]: any
}
