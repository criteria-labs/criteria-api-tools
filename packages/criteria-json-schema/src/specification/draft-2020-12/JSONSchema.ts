// JSON Schema Specification B. Hutton Draft 01
// https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01

import {
  JSONSchemaApplicatorVocabulary,
  JSONSchemaContentVocabulary,
  JSONSchemaCoreVocabulary,
  JSONSchemaFormatAnnotationVocabulary,
  JSONSchemaMetaDataVocabulary,
  JSONSchemaUnevaluatedApplicatorVocabulary,
  JSONSchemaValidationVocabulary
} from './vocabularies'

export type JSONSchemaPrimitiveType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'integer' | 'string'

export type JSONSchemaValue = null | boolean | { [key: string]: JSONSchemaValue } | JSONSchemaValue[] | number | string

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-4.3.2
 */
export type JSONSchemaBooleanSchema = boolean

/**
 * JSON Schema Draft 2020-12
 *
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00
 */
export type JSONSchema<ReferenceType extends string | object = string, AdditionalVocabularies extends object = {}> =
  | JSONSchemaBooleanSchema
  | (JSONSchemaCoreVocabulary<ReferenceType, AdditionalVocabularies> &
      JSONSchemaApplicatorVocabulary<ReferenceType, AdditionalVocabularies> &
      JSONSchemaValidationVocabulary &
      JSONSchemaUnevaluatedApplicatorVocabulary<ReferenceType, AdditionalVocabularies> &
      JSONSchemaFormatAnnotationVocabulary &
      JSONSchemaContentVocabulary<ReferenceType, AdditionalVocabularies> &
      JSONSchemaMetaDataVocabulary &
      AdditionalVocabularies)

export type DereferencedJSONSchema = JSONSchema<object>
