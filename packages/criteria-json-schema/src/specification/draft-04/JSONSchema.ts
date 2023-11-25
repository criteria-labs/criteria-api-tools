// JSON Schema Specification Wright Draft 00
// https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00

export const metaSchemaURI = 'http://json-schema.org/draft-04/schema#'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.21
 */
export type JSONSchemaPrimitiveType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'integer' | 'string'

export type JSONSchemaValue = null | boolean | { [key: string]: JSONSchemaValue } | JSONSchemaValue[] | number | string

export type Reference = {
  $ref: string
}

/**
 * JSON Schema Draft 04
 *
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00
 */
export interface JSONSchema<ReferenceType extends Reference | never = Reference> {
  $schema?: string
  id?: string

  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string

  additionalItems?: boolean | JSONSchemaSubschema<ReferenceType>
  items?: JSONSchemaSubschema<ReferenceType> | JSONSchemaSubschema<ReferenceType>[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean

  maxProperties?: number
  minProperties?: number
  required?: [string, ...string[]]
  properties?: { [key: string]: JSONSchemaSubschema<ReferenceType> }
  patternProperties?: { [key: string]: JSONSchemaSubschema<ReferenceType> }
  additionalProperties?: boolean | JSONSchemaSubschema<ReferenceType>

  dependencies?: { [key: string]: JSONSchemaSubschema<ReferenceType> | [string, ...string[]] }

  /**
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.20
   */
  enum?: JSONSchemaValue[]

  type?: JSONSchemaPrimitiveType | JSONSchemaPrimitiveType[]

  allOf?: [JSONSchemaSubschema<ReferenceType>, ...JSONSchemaSubschema<ReferenceType>[]]
  anyOf?: [JSONSchemaSubschema<ReferenceType>, ...JSONSchemaSubschema<ReferenceType>[]]
  oneOf?: [JSONSchemaSubschema<ReferenceType>, ...JSONSchemaSubschema<ReferenceType>[]]
  not?: JSONSchemaSubschema<ReferenceType>

  definitions?: { [key: string]: JSONSchemaSubschema<ReferenceType> }

  title?: string
  description?: string

  default?: JSONSchemaValue

  format?: string

  /**
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-5.4
   */
  [key: string]: any
}

/**
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-7
 */
export type JSONSchemaSubschema<ReferenceType extends Reference | never> = JSONSchema<ReferenceType> | ReferenceType

export type DereferencedJSONSchema = JSONSchema<never>
