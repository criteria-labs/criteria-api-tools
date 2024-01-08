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
): MaybePromise<JSONValidator>
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

export async function jsonValidatorAsync(
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<JSONValidator> {
  return await jsonValidator(schema, options)
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
): MaybePromise<void>
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

export async function validateJSONAsync(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<void> {
  await validateJSON(instance, schema, options)
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
): MaybePromise<boolean>
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

export async function isJSONValidAsync(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaURI'>
): Promise<boolean> {
  return await isJSONValid(instance, schema, options)
}
