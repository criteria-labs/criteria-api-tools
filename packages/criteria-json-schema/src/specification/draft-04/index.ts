// JSON Schema Specification Wright Draft 00
// https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00

/**
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.21
 */
export type JSONSchemaPrimitiveType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'integer' | 'string'

export type JSONSchemaValue = null | boolean | { [key: string]: JSONSchemaValue } | JSONSchemaValue[] | number | string

/**
 * JSON Schema Draft 04
 *
 * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00
 */
export interface JSONSchema {
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

  additionalItems?: boolean | JSONSchemaSubschema
  items?: JSONSchemaSubschema | JSONSchemaSubschema[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean

  maxProperties?: number
  minProperties?: number
  required?: [string, ...string[]]
  properties?: { [key: string]: JSONSchemaSubschema }
  patternProperties?: { [key: string]: JSONSchemaSubschema }
  additionalProperties?: boolean | JSONSchemaSubschema

  dependencies?: { [key: string]: JSONSchemaSubschema | [string, ...string[]] }

  /**
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.20
   */
  enum?: JSONSchemaValue[]

  type?: JSONSchemaPrimitiveType | JSONSchemaPrimitiveType[]

  allOf?: [JSONSchemaSubschema, ...JSONSchemaSubschema[]]
  anyOf?: [JSONSchemaSubschema, ...JSONSchemaSubschema[]]
  oneOf?: [JSONSchemaSubschema, ...JSONSchemaSubschema[]]
  not?: JSONSchemaSubschema

  definitions?: { [key: string]: JSONSchemaSubschema }

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
export type JSONSchemaSubschema = JSONSchema | { $ref: string }
