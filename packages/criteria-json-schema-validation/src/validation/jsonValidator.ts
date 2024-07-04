import { SchemaIndex } from '@criteria/json-schema'
import { metaSchemaID as draft2020_12URI } from '../draft-2020-12'
import { ValidationError } from '../errors/ValidationError'
import { MaybePromise, chain } from '../util/promises'
import { FlagOutput, OutputFormat, VerboseOutput } from './Output'
import { booleanValidator } from './booleanValidator'
import { keywordValidatorsForMetaSchemaIDFactory } from './keywordValidators'
import { normalizedMetaSchemaID } from './normalizedMetaSchemaID'
import { validatorBinder } from './validatorBinder'

// default options
export const defaultOutputFormat = 'flag'
export const defaultFailFast = false
export const defaultAssertFormat = false
export const defaultDefaultMetaSchemaID = draft2020_12URI

export type Retrieve = (uri: string) => any | Promise<any>

export type ValidateOptions = {
  outputFormat?: OutputFormat
  failFast?: boolean
  assertFormat?: boolean
  baseURI?: string
  retrieve?: (uri: string) => any
  defaultMetaSchemaID?: string
}

export type AsyncValidateOptions = Omit<ValidateOptions, 'retrieve'> & {
  retrieve?: (uri: string) => Promise<any>
}

export type JSONValidator = (instance: unknown) => FlagOutput | VerboseOutput

export function jsonValidator(schema: object | boolean, options?: Omit<ValidateOptions, 'retrieve'>): JSONValidator
export function jsonValidator(schema: object | boolean, options?: AsyncValidateOptions): MaybePromise<JSONValidator>
export function jsonValidator(schema: object | boolean, options?: ValidateOptions): JSONValidator

export function jsonValidator(
  schema: object | boolean,
  options?: ValidateOptions | AsyncValidateOptions
): MaybePromise<JSONValidator> {
  const outputFormat = options?.outputFormat ?? defaultOutputFormat
  const failFast = outputFormat === 'flag' ? true : options?.failFast ?? defaultFailFast // flag output format is effectively the same as fail fast
  const assertFormat = options?.assertFormat ?? defaultAssertFormat
  const defaultMetaSchemaID = normalizedMetaSchemaID(options?.defaultMetaSchemaID ?? defaultDefaultMetaSchemaID)

  if (typeof schema === 'boolean') {
    const validator = booleanValidator(schema, [''], { outputFormat })
    return (instance: unknown) => {
      return validator(instance, '')
    }
  }

  // Index root schema
  const index = new SchemaIndex({
    cloned: false,
    retrieve: options?.retrieve,
    defaultMetaSchemaID: defaultMetaSchemaID
  })
  const addRootSchemaResult = index.addRootSchema(schema, options?.baseURI ?? '')
  return chain(addRootSchemaResult, () => {
    const validatorsForMetaSchemaID = keywordValidatorsForMetaSchemaIDFactory({
      assertFormat,
      retrieve: index.retrieve
    })
    const boundValidatorForSchema = validatorBinder(index, {
      outputFormat,
      failFast,
      validatorsForMetaSchemaID
    })

    const boundValidator = boundValidatorForSchema(schema, [''])
    return function validateInstance(instance: unknown) {
      return boundValidator(instance, '')
    }
  })
}

export async function jsonValidatorAsync(
  schema: object | boolean,
  options?: AsyncValidateOptions
): Promise<JSONValidator> {
  return await jsonValidator(schema, options)
}

export function validateJSON(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<ValidateOptions, 'retrieve'>
): void
export function validateJSON(
  instance: unknown,
  schema: object | boolean,
  options?: AsyncValidateOptions
): MaybePromise<void>
export function validateJSON(instance: unknown, schema: object | boolean, options?: ValidateOptions): void

export function validateJSON(
  instance: unknown,
  schema: object | boolean,
  options?: ValidateOptions | AsyncValidateOptions
): MaybePromise<void> {
  const validator = jsonValidator(schema, options)
  return chain(validator, (validator) => {
    const output = validator(instance)
    if (!output.valid) {
      const message = 'message' in output ? output.message : 'is invalid'
      throw new ValidationError(`The value ${message}`, { output })
    }
  })
}

export async function validateJSONAsync(
  instance: unknown,
  schema: object | boolean,
  options?: AsyncValidateOptions
): Promise<void> {
  await validateJSON(instance, schema, options)
}

export function isJSONValid(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<ValidateOptions, 'failFast' | 'retrieve'>
): boolean
export function isJSONValid(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<AsyncValidateOptions, 'failFast'>
): MaybePromise<boolean>
export function isJSONValid(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<ValidateOptions, 'failFast'>
): boolean

export function isJSONValid(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<ValidateOptions | AsyncValidateOptions, 'failFast'>
): MaybePromise<boolean> {
  const validator = jsonValidator(schema, { ...options, failFast: true })
  return chain(validator, (validator) => {
    const { valid } = validator(instance)
    return valid
  })
}

export async function isJSONValidAsync(
  instance: unknown,
  schema: object | boolean,
  options?: Omit<AsyncValidateOptions, 'failFast'>
): Promise<boolean> {
  return await isJSONValid(instance, schema, options)
}
