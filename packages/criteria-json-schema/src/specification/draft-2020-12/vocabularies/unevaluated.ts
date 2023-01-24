import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11
 */
export type JSONSchemaUnevaluatedApplicatorVocabulary<
  ReferenceType extends string | object,
  AdditionalVocabularies extends object
> = {
  unevaluatedItems?: JSONSchema<ReferenceType, AdditionalVocabularies>
  unevaluatedProperties?: JSONSchema<ReferenceType, AdditionalVocabularies>
}
