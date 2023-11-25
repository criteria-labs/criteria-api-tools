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

export const metaSchemaURI = 'https://json-schema.org/draft/2020-12/schema'

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
export type JSONSchema<AdditionalVocabularies extends object = {}, ReferenceType extends string | object = string> =
  | JSONSchemaBooleanSchema
  | JSONSchemaObject<AdditionalVocabularies, ReferenceType>

export type JSONSchemaObject<
  AdditionalVocabularies extends object = {},
  ReferenceType extends string | object = string
> = JSONSchemaCoreVocabulary<AdditionalVocabularies, ReferenceType> &
  JSONSchemaApplicatorVocabulary<AdditionalVocabularies, ReferenceType> &
  JSONSchemaValidationVocabulary &
  JSONSchemaUnevaluatedApplicatorVocabulary<AdditionalVocabularies, ReferenceType> &
  JSONSchemaFormatAnnotationVocabulary &
  JSONSchemaContentVocabulary<AdditionalVocabularies, ReferenceType> &
  JSONSchemaMetaDataVocabulary &
  AdditionalVocabularies

export type DereferencedJSONSchema<AdditionalVocabularies extends object = {}> = JSONSchema<
  AdditionalVocabularies,
  object
>
export type DereferencedJSONSchemaObject<AdditionalVocabularies extends object = {}> = JSONSchemaObject<
  AdditionalVocabularies,
  object
>
