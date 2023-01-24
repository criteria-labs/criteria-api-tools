import { JSONSchema } from '../JSONSchema'

/**
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10
 */
export type JSONSchemaApplicatorVocabulary<
  ReferenceType extends string | object,
  AdditionalVocabularies extends object
> = {
  allOf?: [JSONSchema<ReferenceType, AdditionalVocabularies>, ...JSONSchema<ReferenceType, AdditionalVocabularies>[]]
  anyOf?: [JSONSchema<ReferenceType, AdditionalVocabularies>, ...JSONSchema<ReferenceType, AdditionalVocabularies>[]]
  oneOf?: [JSONSchema<ReferenceType, AdditionalVocabularies>, ...JSONSchema<ReferenceType, AdditionalVocabularies>[]]
  not?: JSONSchema<ReferenceType, AdditionalVocabularies>
  if?: JSONSchema<ReferenceType, AdditionalVocabularies>
  then?: JSONSchema<ReferenceType, AdditionalVocabularies>
  else?: JSONSchema<ReferenceType, AdditionalVocabularies>
  dependentSchemas?: { [key: string]: JSONSchema<ReferenceType, AdditionalVocabularies> }

  prefixItems?: [
    JSONSchema<ReferenceType, AdditionalVocabularies>,
    ...JSONSchema<ReferenceType, AdditionalVocabularies>[]
  ]
  items?: JSONSchema<ReferenceType, AdditionalVocabularies>
  contains?: JSONSchema<ReferenceType, AdditionalVocabularies>

  properties?: { [key: string]: JSONSchema<ReferenceType, AdditionalVocabularies> }
  patternProperties?: { [key: string]: JSONSchema<ReferenceType, AdditionalVocabularies> }
  additionalProperties?: JSONSchema<ReferenceType, AdditionalVocabularies>
  propertyNames?: JSONSchema<ReferenceType, AdditionalVocabularies>
}
