import { JSONSchema } from '@criteria/json-schema/draft-06'
import { ValidateOptions } from '../../validation/jsonValidator'
import { jsonValidator } from './jsonValidator'

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>
) {
  const validator = jsonValidator(schema, options)
  validator(instance)
}