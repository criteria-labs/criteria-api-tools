import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#section-8
 */
export type JSONSchemaContentVocabulary = {
  contentEncoding?: string
  contentMediaType?: string
  contentSchema?: JSONSchema
}
