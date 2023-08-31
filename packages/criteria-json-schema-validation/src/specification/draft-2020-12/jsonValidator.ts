import { DereferencedJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { jsonValidator as jsonValidatorWithConfiguration } from '../../validation/jsonValidator'
import validatorConfiguration from './validatorConfiguration'

interface Options {
  failFast?: boolean
  retrieve?: (uri: string) => any
}

export function jsonValidator(schema: DereferencedJSONSchemaDraft2020_12, options?: Options) {
  return jsonValidatorWithConfiguration(schema, { ...options, configuration: validatorConfiguration })
}
