import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10
 */
export type JSONSchemaApplicatorVocabulary<AdditionalVocabularies> = {
  allOf?: [JSONSchema<AdditionalVocabularies>, ...JSONSchema<AdditionalVocabularies>[]]
  anyOf?: [JSONSchema<AdditionalVocabularies>, ...JSONSchema<AdditionalVocabularies>[]]
  oneOf?: [JSONSchema<AdditionalVocabularies>, ...JSONSchema<AdditionalVocabularies>[]]
  not?: JSONSchema<AdditionalVocabularies>
  if?: JSONSchema<AdditionalVocabularies>
  then?: JSONSchema<AdditionalVocabularies>
  else?: JSONSchema<AdditionalVocabularies>
  dependentSchemas?: { [key: string]: JSONSchema<AdditionalVocabularies> }

  prefixItems?: [JSONSchema<AdditionalVocabularies>, ...JSONSchema<AdditionalVocabularies>[]]
  items?: JSONSchema<AdditionalVocabularies>
  contains?: JSONSchema<AdditionalVocabularies>

  properties?: { [key: string]: JSONSchema<AdditionalVocabularies> }
  patternProperties?: { [key: string]: JSONSchema<AdditionalVocabularies> }
  additionalProperties?: JSONSchema<AdditionalVocabularies>
  propertyNames?: JSONSchema<AdditionalVocabularies>
}
