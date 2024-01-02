import { JSONSchema, metaSchemaURI } from '@criteria/json-schema/draft-06'
import { ValidationError } from '../../errors/ValidationError'
import { ValidateOptions, jsonValidator as jsonValidatorWithDefaultMetaSchemaURI } from '../../validation/jsonValidator'

export function jsonValidator(schema: JSONSchema, options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>) {
  return jsonValidatorWithDefaultMetaSchemaURI(schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>
) {
  const validator = jsonValidator(schema, options)
  const output = validator(instance)
  if (!output.valid) {
    const message = 'message' in output ? output.message : 'is invalid'
    throw new ValidationError(`The value ${message}`, { output })
  }
}

export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI' | 'failFast'>
) {
  const validator = jsonValidator(schema, { ...options, failFast: true })
  const { valid } = validator(instance)
  return valid
}
