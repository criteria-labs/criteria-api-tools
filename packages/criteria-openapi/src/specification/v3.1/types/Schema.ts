import { JSONSchema } from '@criteria/json-schema/draft-2020-12'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { XML } from './XML'
import type { Reference } from './Reference'

export type Schema<ReferenceType extends Reference | never> = JSONSchema<
  {
    discriminator?: Discriminator
    xml?: XML
    externalDocs?: ExternalDocumentation
    example?: any

    [key: `x-${string}`]: any
  },
  ReferenceType extends Reference ? string | object : object
>
