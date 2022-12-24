import { JSONSchemaDraft04, JSONSchemaDraft04PrimitiveType, JSONSchemaDraft04Value } from '@criteria/json-schema'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Reference } from './Reference'
import { XML } from './XML'

export type Schema<ReferenceType extends Reference | never> = Pick<
  JSONSchemaDraft04,
  | 'title'
  | 'multipleOf'
  | 'maximum'
  | 'exclusiveMaximum'
  | 'minimum'
  | 'exclusiveMinimum'
  | 'maxLength'
  | 'minLength'
  | 'pattern'
  | 'maxItems'
  | 'minItems'
  | 'uniqueItems'
  | 'maxProperties'
  | 'minProperties'
  | 'required'
  | 'enum'
> & {
  type?: JSONSchemaDraft04PrimitiveType

  allOf?: [Schema<ReferenceType> | ReferenceType, ...Array<Schema<ReferenceType> | ReferenceType>]
  anyOf?: [Schema<ReferenceType>, ...Array<Schema<ReferenceType> | ReferenceType>]
  oneOf?: [Schema<ReferenceType>, ...Array<Schema<ReferenceType> | ReferenceType>]
  not?: Schema<ReferenceType> | ReferenceType

  items?: Schema<ReferenceType> | ReferenceType

  properties?: { [key: string]: Schema<ReferenceType> | ReferenceType }
  additionalProperties?: boolean | Schema<ReferenceType> | ReferenceType

  description?: string
  format?: string
  default?: JSONSchemaDraft04Value
} & {
  nullable?: boolean
  discriminator?: Discriminator
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XML
  externalDocs?: ExternalDocumentation
  example?: any
  deprecated?: boolean

  [key: `x-${string}`]: any
}
