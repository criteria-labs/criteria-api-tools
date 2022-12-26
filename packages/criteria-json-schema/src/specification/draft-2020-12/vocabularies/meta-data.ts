import { JSONSchemaValue } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#section-9
 */
export type JSONSchemaMetaDataVocabulary = {
  title?: string
  description?: string
  default?: JSONSchemaValue
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  examples?: JSONSchemaValue[]
}
