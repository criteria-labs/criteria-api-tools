import { JSONSchema, JSONSchemaPrimitiveType, JSONSchemaValue } from '@criteria/json-schema/draft-04'
import { Discriminator } from './Discriminator'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Reference } from './Reference'
import { XML } from './XML'

export type Schema<ReferenceType extends Reference | never> = Pick<
  JSONSchema,
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
  type?: JSONSchemaPrimitiveType

  allOf?: [Schema<ReferenceType> | ReferenceType, ...Array<Schema<ReferenceType> | ReferenceType>]
  anyOf?: [Schema<ReferenceType> | ReferenceType, ...Array<Schema<ReferenceType> | ReferenceType>]
  oneOf?: [Schema<ReferenceType> | ReferenceType, ...Array<Schema<ReferenceType> | ReferenceType>]
  not?: Schema<ReferenceType> | ReferenceType

  items?: Schema<ReferenceType> | ReferenceType

  properties?: { [key: string]: Schema<ReferenceType> | ReferenceType }
  additionalProperties?: boolean | Schema<ReferenceType> | ReferenceType

  description?: string
  format?: string
  default?: JSONSchemaValue
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
