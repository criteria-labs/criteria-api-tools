import { JSONSchema, metaSchemaURI } from '@criteria/json-schema/draft-2020-12'
import { ValidateOptions, jsonValidator as jsonValidatorWithDefaultMetaSchemaURI } from '../../validation/jsonValidator'

export function jsonValidator(schema: JSONSchema, options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>) {
  return jsonValidatorWithDefaultMetaSchemaURI(schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}
