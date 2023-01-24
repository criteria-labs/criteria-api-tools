import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10
 */
export type JSONSchemaApplicatorVocabulary<
  AdditionalVocabularies extends object,
  ReferenceType extends string | object
> = {
  allOf?: [JSONSchema<AdditionalVocabularies, ReferenceType>, ...JSONSchema<AdditionalVocabularies, ReferenceType>[]]
  anyOf?: [JSONSchema<AdditionalVocabularies, ReferenceType>, ...JSONSchema<AdditionalVocabularies, ReferenceType>[]]
  oneOf?: [JSONSchema<AdditionalVocabularies, ReferenceType>, ...JSONSchema<AdditionalVocabularies, ReferenceType>[]]
  not?: JSONSchema<AdditionalVocabularies, ReferenceType>
  if?: JSONSchema<AdditionalVocabularies, ReferenceType>
  then?: JSONSchema<AdditionalVocabularies, ReferenceType>
  else?: JSONSchema<AdditionalVocabularies, ReferenceType>
  dependentSchemas?: { [key: string]: JSONSchema<AdditionalVocabularies, ReferenceType> }

  prefixItems?: [
    JSONSchema<AdditionalVocabularies, ReferenceType>,
    ...JSONSchema<AdditionalVocabularies, ReferenceType>[]
  ]
  items?: JSONSchema<AdditionalVocabularies, ReferenceType>
  contains?: JSONSchema<AdditionalVocabularies, ReferenceType>

  properties?: { [key: string]: JSONSchema<AdditionalVocabularies, ReferenceType> }
  patternProperties?: { [key: string]: JSONSchema<AdditionalVocabularies, ReferenceType> }
  additionalProperties?: JSONSchema<AdditionalVocabularies, ReferenceType>
  propertyNames?: JSONSchema<AdditionalVocabularies, ReferenceType>
}
