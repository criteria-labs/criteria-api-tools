import { JSONSchemaPrimitiveType, JSONSchemaValue } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#section-6
 */
export type JSONSchemaValidationVocabulary = {
  type?: JSONSchemaPrimitiveType | JSONSchemaPrimitiveType[]
  enum?: JSONSchemaValue[]
  const?: JSONSchemaValue

  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number

  maxLength?: number
  minLength?: number
  pattern?: string

  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxContains?: number
  minContains?: number

  maxProperties?: number
  minProperties?: number
  required?: [string, ...string[]]
  dependentRequired?: { [key: string]: string[] }
}
