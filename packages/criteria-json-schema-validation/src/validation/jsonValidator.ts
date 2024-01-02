import { DereferenceOptions, SchemaIndex } from '@criteria/json-schema'
import { FlagOutput, Output, OutputFormat, VerboseOutput } from './Output'
import { booleanValidator } from './booleanValidator'
import { keywordValidatorsForMetaSchemaURIFactory } from './keywordValidators'
import { validatorBinder } from './validatorBinder'

// default options
export const defaultOutputFormat = 'flag'
export const defaultFailFast = false
export const defaultAssertFormat = false

export type ValidateOptions = DereferenceOptions & {
  outputFormat?: OutputFormat
  failFast?: boolean
  assertFormat?: boolean
}

export function jsonValidator(
  schema: object | boolean,
  options?: ValidateOptions
): (instance: unknown) => FlagOutput | VerboseOutput {
  const outputFormat = options.outputFormat ?? defaultOutputFormat
  const failFast = outputFormat === 'flag' ? true : options.failFast ?? defaultFailFast // flag output format is effectively the same as fail fast
  const assertFormat = options.assertFormat ?? defaultAssertFormat

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
    defaultMetaSchemaURI: options.defaultMetaSchemaURI
  })
  index.addRootSchema(schema, options?.baseURI ?? '')

  const validatorsForMetaSchemaURI = keywordValidatorsForMetaSchemaURIFactory({
    assertFormat,
    retrieve: index.retrieve
  })
  const boundValidatorForSchema = validatorBinder(index, {
    outputFormat,
    failFast,
    validatorsForMetaSchemaURI
  })

  const boundValidator = boundValidatorForSchema(schema, [''])
  return function validateInstance(instance: unknown) {
    return boundValidator(instance, '')
  }
}
