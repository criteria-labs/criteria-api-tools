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
export type JSONSchema =
  | JSONSchemaBooleanSchema
  | ({
      /**
       * @deprecated "definitions" has been replaced by "$defs".
       */
      definitions: { [key: string]: JSONSchema }

      /**
       * @deprecated "dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.
       */
      dependencies: { [key: string]: JSONSchema | [string, ...string[]] }

      /**
       * @deprecated "$recursiveAnchor" has been replaced by "$dynamicAnchor".
       */
      $recursiveAnchor: string

      /**
       * @deprecated "$recursiveRef" has been replaced by "$dynamicRef".
       */
      $recursiveRef: string
    } & JSONSchemaCoreVocabulary &
      JSONSchemaApplicatorVocabulary &
      JSONSchemaValidationVocabulary &
      JSONSchemaUnevaluatedApplicatorVocabulary &
      JSONSchemaFormatAnnotationVocabulary &
      JSONSchemaContentVocabulary &
      JSONSchemaMetaDataVocabulary & {
        /**
         * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-6.5
         */
        [key: string]: any
      })
