import { JSONSchema, metaSchemaID } from '@criteria/json-schema/draft-07'
import { MaybePromise } from '../../util/promises'
import {
  AsyncValidateOptions,
  JSONValidator,
  ValidateOptions,
  isJSONValid as isJSONValidWithDefaultMetaSchemaID,
  jsonValidator as jsonValidatorWithDefaultMetaSchemaID,
  validateJSON as validateJSONWithDefaultMetaSchemaID
} from '../../validation/jsonValidator'

export { metaSchemaID }

export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaID' | 'retrieve'>
): JSONValidator
export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<JSONValidator>
export function jsonValidator(schema: JSONSchema, options?: Omit<ValidateOptions, 'defaultMetaSchemaID'>): JSONValidator

export function jsonValidator(
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<JSONValidator> {
  return jsonValidatorWithDefaultMetaSchemaID(schema, { ...options, defaultMetaSchemaID: metaSchemaID })
}

export async function jsonValidatorAsync(
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): Promise<JSONValidator> {
  return await jsonValidator(schema, options)
}

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaID' | 'retrieve'>
): void
export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<void>
export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaID'>
): void

export function validateJSON(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<void> {
  return validateJSONWithDefaultMetaSchemaID(instance, schema, { ...options, defaultMetaSchemaID: metaSchemaID })
}

export async function validateJSONAsync(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): Promise<void> {
  await validateJSON(instance, schema, options)
}

export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaID' | 'retrieve'>
): boolean
export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<boolean>
export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions, 'defaultMetaSchemaID'>
): boolean

export function isJSONValid(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'defaultMetaSchemaID'>
): MaybePromise<boolean> {
  return isJSONValidWithDefaultMetaSchemaID(instance, schema, { ...options, defaultMetaSchemaID: metaSchemaID })
}

export async function isJSONValidAsync(
  instance: unknown,
  schema: JSONSchema,
  options?: Omit<AsyncValidateOptions, 'defaultMetaSchemaID'>
): Promise<boolean> {
  return await isJSONValid(instance, schema, options)
}
