import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10
 */
export type JSONSchemaApplicatorVocabulary = {
  allOf?: [JSONSchema, ...JSONSchema[]]
  anyOf?: [JSONSchema, ...JSONSchema[]]
  oneOf?: [JSONSchema, ...JSONSchema[]]
  not?: JSONSchema
  if?: JSONSchema
  then?: JSONSchema
  else?: JSONSchema
  dependentSchemas?: { [key: string]: JSONSchema }

  prefixItems?: [JSONSchema, ...JSONSchema[]]
  items?: JSONSchema
  contains?: JSONSchema

  properties?: { [key: string]: JSONSchema }
  patternProperties?: { [key: string]: JSONSchema }
  additionalProperties?: JSONSchema
  propertyNames?: JSONSchema
}
