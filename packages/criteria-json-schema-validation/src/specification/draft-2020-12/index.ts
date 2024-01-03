import { JSONSchema, metaSchemaURI } from '@criteria/json-schema/draft-2020-12'
import { MaybePromise } from '../../util/promises'
import {
  AsyncValidateOptions,
  JSONValidator,
  ValidateOptions,
  isJSONValid as isJSONValidWithDefaultMetaSchemaURI,
  jsonValidator as jsonValidatorWithDefaultMetaSchemaURI,
  validateJSON as validateJSONWithDefaultMetaSchemaURI
} from '../../validation/jsonValidator'

export { metaSchemaURI }

export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI' | 'retrieve'>
): JSONValidator
export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<JSONValidator>
export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>
): JSONValidator

export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaURI'>
): MaybePromise<JSONValidator> {
  return jsonValidatorWithDefaultMetaSchemaURI(schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI' | 'retrieve'>
): void
export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<void>
export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>
): void

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaURI'>
): MaybePromise<void> {
  return validateJSONWithDefaultMetaSchemaURI(instance, schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}

export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI' | 'retrieve'>
): boolean
export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<boolean>
export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaURI'>
): boolean

export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaURI'>
): MaybePromise<boolean> {
  return isJSONValidWithDefaultMetaSchemaURI(instance, schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}
