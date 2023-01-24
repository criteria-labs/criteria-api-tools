import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11
 */
export type JSONSchemaUnevaluatedApplicatorVocabulary<
  AdditionalVocabularies extends object,
  ReferenceType extends string | object
> = {
  unevaluatedItems?: JSONSchema<AdditionalVocabularies, ReferenceType>
  unevaluatedProperties?: JSONSchema<AdditionalVocabularies, ReferenceType>
}
