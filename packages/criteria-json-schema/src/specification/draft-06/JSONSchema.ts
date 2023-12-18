// JSON Schema Specification Wright Draft 01
// https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01

export const metaSchemaURI = 'http://json-schema.org/draft-06/schema#'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01#section-6.25
 */
export type JSONSchemaPrimitiveType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'integer' | 'string'

export type JSONSchemaValue = null | boolean | { [key: string]: JSONSchemaValue } | JSONSchemaValue[] | number | string

/**
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-01#section-4.4
 */
export type JSONSchemaBooleanSchema = boolean

/**
 * JSON Schema Draft 06
 *
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-01
 */
export type JSONSchema<ReferenceType extends string | object = string> =
  | JSONSchemaBooleanSchema
  | JSONSchemaObject<ReferenceType>

/**
 * JSON Schema Draft 06
 *
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-01
 */
export interface JSONSchemaObject<ReferenceType extends string | object = string> {
  $schema?: string
  $id?: string
  $ref?: ReferenceType extends string ? string : JSONSchema<ReferenceType>

  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
  maxLength?: number
  minLength?: number
  pattern?: string

  additionalItems?: boolean | JSONSchema<ReferenceType>
  items?: JSONSchema<ReferenceType> | JSONSchema<ReferenceType>[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  contains?: JSONSchema<ReferenceType>

  maxProperties?: number
  minProperties?: number
  required?: string[]
  properties?: { [key: string]: JSONSchema<ReferenceType> }
  patternProperties?: { [key: string]: JSONSchema<ReferenceType> }
  additionalProperties?: boolean | JSONSchema<ReferenceType>

  dependencies?: { [key: string]: JSONSchema<ReferenceType> | string[] }

  propertyNames?: JSONSchema<ReferenceType>

  enum?: JSONSchemaValue[]
  const?: JSONSchemaValue
  type?: JSONSchemaPrimitiveType | JSONSchemaPrimitiveType[]

  allOf?: [JSONSchema<ReferenceType>, ...JSONSchema<ReferenceType>[]]
  anyOf?: [JSONSchema<ReferenceType>, ...JSONSchema<ReferenceType>[]]
  oneOf?: [JSONSchema<ReferenceType>, ...JSONSchema<ReferenceType>[]]
  not?: JSONSchema<ReferenceType>

  definitions?: { [key: string]: JSONSchema<ReferenceType> }

  title?: string
  description?: string

  default?: JSONSchemaValue
  examples?: JSONSchemaValue[]

  format?: string

  /**
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-01#section-6.4
   */
  [key: string]: any
}

export type DereferencedJSONSchema = JSONSchema<object>
