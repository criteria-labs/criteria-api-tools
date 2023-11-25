import { DereferenceOptions, SchemaIndex } from '@criteria/json-schema'
import { ValidationError } from '../errors/ValidationError'
import { InvalidOutput } from './Output'
import { booleanValidator } from './booleanValidator'
import { keywordValidatorsForMetaSchemaURIFactory } from './keywordValidators'
import { validatorBinder } from './validatorBinder'

// default options
export const defaultFailFast = false

export type ValidateOptions = DereferenceOptions & {
  failFast?: boolean
}

export function jsonValidator(schema: object | boolean, options?: ValidateOptions): (instance: unknown) => void {
  if (typeof schema === 'boolean') {
    const validator = booleanValidator(schema, [''])
    return (instance: unknown) => {
      const output = validator(instance, '')
      if (!output.valid) {
        throw new ValidationError(`Value ${(output as InvalidOutput).message ?? 'is invalid'}`, { output })
      }
    }
  }

  const failFast = options.failFast ?? defaultFailFast

  // Index root schema
  const index = new SchemaIndex({
    cloned: false,
    retrieve: options?.retrieve,
    defaultMetaSchemaURI: options.defaultMetaSchemaURI
  })
  index.addDocument(schema, options?.baseURI ?? '', '', '')

  const validatorsForMetaSchemaURI = keywordValidatorsForMetaSchemaURIFactory(index.retrieve)
  const boundValidatorForSchema = validatorBinder(index, {
    failFast,
    validatorsForMetaSchemaURI
  })

  const boundValidator = boundValidatorForSchema(schema, [''])
  return (instance: unknown) => {
    const output = boundValidator(instance, '')
    if (!output.valid) {
      throw new ValidationError(`Value ${(output as InvalidOutput).message ?? 'is invalid'}`, { output })
    }
  }
}
