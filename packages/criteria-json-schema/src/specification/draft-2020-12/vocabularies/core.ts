import { JSONSchema } from '../JSONSchema'

/**
 * JSON Schema Draft 2012-12 Core Vocabulary
 *
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8
 */
export type JSONSchemaCoreVocabulary<AdditionalVocabularies extends object, ReferenceType extends string | object> = {
  $schema?: string
  $vocabulary?: { [uri: string]: boolean }
  $id?: string
  $anchor?: string
  $dynamicAnchor?: string
  $ref?: ReferenceType extends string ? string : JSONSchema<AdditionalVocabularies, ReferenceType>
  $dynamicRef?: string
  $defs?: { [key: string]: JSONSchema<AdditionalVocabularies, ReferenceType> }
  $comment?: string
}
