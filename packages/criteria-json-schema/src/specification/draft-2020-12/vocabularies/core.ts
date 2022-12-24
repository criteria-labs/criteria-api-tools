import { JSONSchema } from '..'

/**
 * JSON Schema Draft 2012-12 Core Vocabulary
 *
 * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8
 */
export type JSONSchemaCoreVocabulary = {
  $schema?: string
  $vocabulary?: { [uri: string]: boolean }
  $id?: string
  $anchor?: string
  $dynamicAnchor?: string
  $ref?: string
  $dynamicRef?: string
  $defs?: { [key: string]: JSONSchema }
  $comment?: string
}
